/* eslint-disable @typescript-eslint/no-unused-vars */
/* istanbul ignore file */
// noinspection JSUnusedGlobalSymbols

import { AsyncLocalStorage } from 'async_hooks';
import { ISettings, Logger } from 'tslog';
import { ISettingsParam, TLogLevelName } from 'tslog/src/interfaces';
import { FileLogger } from './file-logger';
import { ILoggerSettings, ImErrOptions, TErr } from './interfaces';
import { isObject, reduceAnyError } from './utils';

const asyncLocalStorage: AsyncLocalStorage<{ requestId: string }> = new AsyncLocalStorage();

export class LoggerEx extends Logger {
  public logLevels: TLogLevelName[];

  public _: Logger;

  // eslint-disable-next-line no-undef
  constructor(settings: ISettingsParam, parentSettings?: ISettings) {
    super(settings, parentSettings);
    // @ts-ignore
    this.logLevels = this._logLevels;
    this._ = new Logger(settings);
  }

  public isLevel(levelName: TLogLevelName): boolean {
    return this.logLevels.indexOf(levelName) >= this.logLevels.indexOf(this.settings.minLevel);
  }

  mErr(err: TErr, options: ImErrOptions | string) {
    if (typeof options === 'string') {
      options = { msg: options };
    }
    if (!isObject(options)) {
      options = {};
    }
    if (!err || typeof err !== 'object') {
      err = {};
    }
    const { msg, thr, noStack } = options;
    if (!err.message) {
      err.message = 'Error';
    }
    if (msg) {
      err.message += `\n${msg}`;
    }
    const print = true;
    const exposeErrorCodeFrame = true;
    const exposeStackTrace = !noStack;
    this.prettyError(err, print, exposeErrorCodeFrame, exposeStackTrace);
    if (thr) {
      throw err;
    }
  }
}

export const getAFLogger = (loggerSettings: ILoggerSettings) => {
  const settings = {
    name: loggerSettings.name || 'log',
    displayLoggerName: false,
    displayFunctionName: false,
    displayFilePath: 'hidden',
    requestId: () => asyncLocalStorage.getStore()?.requestId,
    ...loggerSettings,
  } as ISettingsParam;
  const logger = new LoggerEx(settings);

  const fnError = logger.error;

  logger.error = (...args) => {
    if (args[0]) {
      args[0] = reduceAnyError(args[0]);
    }
    return fnError.apply(logger, args);
  };

  const logger2 = new LoggerEx(settings);
  logger.logLevels.forEach((levelName) => {
    logger[`${levelName}_`] = (...args: any[]) => {
      const fn = logger2[levelName];
      return fn.apply(logger2, args);
    };
  });

  // ============================ file logger ====================================
  const { minLevel, filePrefix, logDir, minLogSize, minErrorLogSize, fileLoggerMap } = loggerSettings;

  const fileLoggerOptions: ILoggerSettings = {
    filePrefix: filePrefix || settings.name,
    logDir,
    minLogSize,
    minErrorLogSize,
    emitter: loggerSettings.emitter,
  };
  const fileLogger = new FileLogger(fileLoggerOptions);

  ['info', 'error'].forEach((fileLoggerType) => {
    const transportLogger: any = {};
    const arr = Object.entries(fileLoggerMap || {}).filter(([, t]) => t === fileLoggerType).map(([l]) => l);
    logger.logLevels.forEach((levelName) => {
      transportLogger[levelName] = arr.includes(levelName) ? fileLogger[fileLoggerType].main : () => undefined;
    });
    logger.attachTransport(transportLogger, fileLoggerType === 'error' ? fileLoggerType : minLevel);
  });

  return {
    logger,
    fileLogger,
    exitOnError: (err: TErr) => {
      if (!(err instanceof Error)) {
        err = new Error(err);
      }
      logger.prettyError(err, true, !err[Symbol.for('noExposeCodeFrame')]);
      process.exit(1);
    },
  };
};
