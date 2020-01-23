import debug from "debug";
import util from "util";
import chalk, { Chalk } from "chalk";

import { EnvVar } from "./env";

export const logRootNamespace = "resolve:cloud:lambda:environment";

const logLevels: Array<[string, Chalk]> = [
  ["log", chalk.white],
  ["error", chalk.red.inverse],
  ["warn", chalk.yellow.inverse],
  ["debug", chalk.white],
  ["info", chalk.green],
  ["verbose", chalk.white]
];
const emptyFunction = Function(); // eslint-disable-line no-new-func

const createLogger = (namespace, getCorrelationId) => {
  let logLevel = "info";
  if (process.env.hasOwnProperty(EnvVar.logLevel)) {
    logLevel = process.env[EnvVar.logLevel] as string;
  }

  const logLevelIndex = logLevels.findIndex(([level]) => level === logLevel);
  if (logLevelIndex < 0) {
    throw new Error(`Log level ${logLevel} is not found in allowed levels`);
  }

  if (!process.env.hasOwnProperty(EnvVar.debugNamespaces)) {
    debug.enable(`${logRootNamespace}:*`);
  } else {
    debug.enable(process.env[EnvVar.debugNamespaces] as string);
  }

  const allowedLevels = logLevels
    .slice(0, logLevelIndex + 1)
    .map(([levelName]) => levelName);

  const originalLogger = debug(namespace);
  const leveledLogger = {};

  for (const [levelName, levelColor] of logLevels) {
    if (allowedLevels.indexOf(levelName) > -1) {
      leveledLogger[levelName] = (...args) => {
        originalLogger(
          `${levelColor(
            levelName.toUpperCase()
          )} <${getCorrelationId()}> ${args.map(arg =>
            Object(arg) === arg ? util.inspect(arg) : arg
          )}`
        );
      };
    } else {
      leveledLogger[levelName] = emptyFunction;
    }
  }

  return leveledLogger as Log;
};

const DEFAULT_CORRELATION_ID = "no-correlation-id";
let correlationId = DEFAULT_CORRELATION_ID;

export const setLogCorrelationId = (nextCorrelationId: string): void => {
  correlationId =
    nextCorrelationId == null ? DEFAULT_CORRELATION_ID : nextCorrelationId;
};

export const resetLogCorrelationId = (): void => {
  correlationId = DEFAULT_CORRELATION_ID;
};

export type Log = {
  log: (...args: Array<any>) => void;
  error: (...args: Array<any>) => void;
  warn: (...args: Array<any>) => void;
  debug: (...args: Array<any>) => void;
  info: (...args: Array<any>) => void;
  verbose: (...args: Array<any>) => void;
};

export const getLog = (scope: string): Log => {
  return createLogger(scope, () => correlationId);
};
