import * as config from 'config';
import * as fse from 'fs-extra';
import { ILoggerSettings } from '../src/types';
import em from './ee';
import { getAFLogger } from '../src';

const { level: minLevel, prefix } = config.get('logger');
const logDir = './_log';
fse.removeSync(logDir);

const loggerSettings: ILoggerSettings = {
  minLevel,
  name: prefix,
  filePrefix: prefix,
  logDir,
  minLogSize: 0,
  minErrorLogSize: 0,
  // displayLoggerName: true,
  // displayFunctionName: true,
  // displayFilePath: 'displayAll',
  emitter: em,
  fileLoggerMap: {
    silly: 'info',
    info: 'info',
    error: 'error',
    fatal: 'error',
  },
};

const { logger /* fileLogger, exitOnError */ } = getAFLogger(loggerSettings);

const TIMEOUT_MILLIS = 100_000;

describe('Test logger', () => {
  test('1', async () => {
    logger.silly('write silly');
    logger.debug('write debug');
    logger.trace('write trace');
    logger.info('write info');
    logger.warn('write warn');
    logger.error('write error');
    logger.fatal('write fatal');
    logger._.silly('write silly_');
    logger._.debug('write debug_');
    logger._.trace('write trace_');
    logger._.info('write info_');
    logger._.warn('write warn_');
    logger._.error('write error_');
    logger._.fatal('write fatal_');
  }, TIMEOUT_MILLIS);
});