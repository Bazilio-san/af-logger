/* eslint-disable no-console,no-constructor-return */
import { TLogLevelName } from 'tslog/src/interfaces';
import {
  cyanN, defaultN, greenN, greyN, magenta, magentaN, redN, reset, underlineOff, yellowN,
} from './color';
import { Nullable, TEchoOptions } from './interfaces';
import { LoggerEx } from './index';

// clear from the cursor position to the beginning of the line: echo -e "\033[1K"
// Or everything on the line, regardless of cursor position: echo -e "\033[2K"
// echo -e '\033[2K'  # clear the screen and do not move the position
// or:
//    echo -e '\033[2J\033[u' # clear the screen and reset the position
// http://ascii-table.com/ansi-escape-sequences.php

/**
 * Класс реализует функции логирования в консоль
 * с возможностью раскраски текста и указания уровня логирования.
 */

const echoOptionsProps = [
  'colorNum',
  'bgColorNum',
  'bold',
  'underscore',
  'reverse',
  'prefix',
  'consoleFunction',
  'logger',
];

/**
 * Checks if the argument is an object of type TEchoOptions
 */
const isEchoOptions = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const props = Object.keys(obj);
  return echoOptionsProps.some((prop) => props.includes(prop));
};

const levelColors = {
  fatal: redN,
  error: redN,
  warn: yellowN,
  info: greenN,
  debug: cyanN,
  trace: greyN,
  silly: magentaN,
};

/**
 * Forms a string - an escape sequence for coloring text in the console
 */
const _c = (options: TEchoOptions = {}): string => {
  // noinspection JSUnusedLocalSymbols
  const {
    colorNum = 0,
    bgColorNum = 0,
    bold = false,
    underscore = false,
    reverse = false,
  } = options;
  const modifier = (bold ? 1 : 0) + (underscore ? 4 : 0) + (reverse ? 7 : 0);
  let color = !bgColorNum ? '49' : bgColorNum;
  color += `;${!colorNum ? defaultN : colorNum}${!modifier ? '' : `;${modifier}`}m`;
  // color = (color === "49;39m" ? "" : `\x1b[${color}`);
  color = `\x1b[${color}`;
  return color;
};

class Echo extends Function {
  public prefix: string;

  private _lastLogMessage: Nullable<string>;

  private logger: LoggerEx;

  constructor(logger: LoggerEx) {
    super();
    this.logger = logger;
    this.prefix = String(this.logger.settings.prefix?.[0] || '');

    this._lastLogMessage = null;
    // @ts-ignore
    return new Proxy(this, { apply: (target, that, args) => target.echo(...args) });
  }

  /**
   * The function of outputting a message to the console with the possibility of coloring and setting a prefix.
   */
  echo(msg: string, options: TEchoOptions = {}): void {
    const color = _c(options);
    if (options.consoleFunction === 'dir') {
      console.dir(msg);
      this._lastLogMessage = msg;
    } else {
      const prefix = options.prefix ? `${color}${underlineOff}${options.prefix}` : this.prefix;
      const logMessage = `${prefix}${color}${msg}${reset}`;
      console.log(logMessage);
      this._lastLogMessage = logMessage;
    }
  }

  g(msg: string): void {
    this.echo(msg, {
      colorNum: greenN,
      bold: true,
    });
  }

  /**
   * Output a message to the console and return the cursor the specified number of lines back
   * Allows you to organize "replaced messages" in the Unix console
   */
  roll(msg: string, lines: number = 1): void {
    if (process.stdin.isTTY) {
      process.stdout.write(`\x1b[${lines}A${msg}\x1b[K\n`);
    } else {
      this.echo(msg);
    }
  }

  log(levelName: TLogLevelName, ...args: any[]) {
    if (levelName !== 'trace' && !this.logger.isLevel(levelName)) {
      return;
    }

    let msg: string = '';

    let title: string = '';

    let options: TEchoOptions = {};

    switch (typeof args[1]) {
      case 'object':
        if (isEchoOptions(args[1])) {
          [msg, options = {}] = args;
        } else if (args[1] == null) {
          [msg] = args;
        } else {
          [title, msg, options = {}] = args;
        }
        break;
      case 'string':
      case 'number':
      case 'boolean':
        // @ts-ignore
        [title, msg, options = {}] = args;
        break;
      default:
        [msg] = args;
    }
    if (typeof msg === 'object') {
      if (options.prettyJSON) {
        msg = JSON.stringify(msg, undefined, 2);
      } else {
        msg = JSON.stringify(msg);
      }
    }
    if (/^ *SELECT /.test(msg)) {
      msg = `${magenta}\n${msg}\n`;
    }
    const {
      colorNum,
      consoleFunction = 'log',
      estimate,
      estimateReset = false,
      linesBefore = 0,
    } = options;

    options.colorNum = colorNum || levelColors[levelName] || greyN;
    const color = _c(options);
    if (estimate) {
      title = `${estimate.getTaken(estimateReset, true)} ${title || ''}`;
    }
    const lb = Number(linesBefore) ? '\n'.repeat(Number(linesBefore)) : '';
    const cTitle = title ? `\x1b[1m${title}: \x1b[21m` : '';
    if (consoleFunction === 'dir') {
      console.dir(msg);
      this._lastLogMessage = msg;
    } else {
      const prefix = options.prefix ? `${color}${underlineOff}${options.prefix}` : this.prefix;
      const logMessage = `${lb}${prefix}${color}${cTitle}${underlineOff}${color}${msg}${reset}`;
      console.log(logMessage);
      this._lastLogMessage = logMessage;
    }
  }

  error(...args: any[]) {
    this.log('error', ...args);
  }

  warn(...args: any[]) {
    this.log('warn', ...args);
  }

  info(...args: any[]) {
    this.log('info', ...args);
  }

  trace(...args: any[]) {
    this.log('trace', ...args);
  }

  debug(...args: any[]) {
    this.log('debug', ...args);
  }

  silly(...args: any[]) {
    this.log('silly', ...args);
  }

  sql(...args: any[]) {
    const DEBUG = process.env.DEBUG || '';
    if (DEBUG === '*' || /\bsql\b/.test(DEBUG)) {
      if (typeof args[2] !== 'object') {
        args[2] = {};
      }
      args[2].formatJSON = true;
      args[0] = `SQL [${args[0]}]`;
      this.log('trace', ...args);
    }
  }
}

export default Echo;
