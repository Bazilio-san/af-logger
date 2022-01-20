import { ILogObject, ISettingsParam, TLogLevelName } from 'tslog/src/interfaces';
import EventEmitter from 'events';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export type TMethod<T> = (...args: any[]) => T;
export type TErr = Error | any;
export type Maybe<T> = T | undefined;
export type Nullable<T> = T | null;

export interface ILoggerSettings extends ISettingsParam {
  name?: string,
  filePrefix?: string,
  logDir?: string,
  minLogSize?: number, // Files smaller than this size will be deleted during rotation. Default = 0
  minErrorLogSize?: number, // Files smaller than this size will be deleted during rotation. Default = minLogSize | 0
  emitter?: EventEmitter,
  fileLoggerMap?: {
    [key in TLogLevelName]?: 'info' | 'error'
  }
}

export interface IFileLogger extends winston.Logger {
  main: (logObject: ILogObject) => ILogObject,
  minLogSize: number,
  dir: string,
  removeEmptyLogs: TMethod<void>,
  transport: DailyRotateFile,
  _readableState?: any,
  _where?: string,
}

export interface ImErrOptions {
  msg?: string,
  thr?: boolean,
  noStack?: boolean
}

export interface TEchoOptions {
  colorNum?: number,
  bgColorNum?: number,
  bold?: boolean,
  underscore?: boolean,
  reverse?: boolean,
  prefix?: string,
  consoleFunction?: 'dir' | 'log',
  logger?: any,
  estimate?: any,
  estimateReset?: boolean,
  prettyJSON?: boolean,
  linesBefore?: number,
}
