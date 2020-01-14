import {
  getLog,
  setLogCorrelationId,
  resetLogCorrelationId,
  logRootNamespace
} from "../log";

const prettify = ({ mock }) =>
  mock.calls.join("\n").replace(/\+\d+ms/gi, "+0ms");

const writeTestLogs = log => {
  const largeObject = {
    a: {
      b: {
        c: {
          arr: [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            {
              a: {
                b: {
                  c: true
                }
              }
            }
          ]
        }
      }
    }
  };

  log.log("test text");
  log.log(42);
  log.log(largeObject);

  log.error("test text");
  log.error(42);
  log.error(largeObject);

  log.warn("test text");
  log.warn(42);
  log.warn(largeObject);

  log.debug("test text");
  log.debug(42);
  log.debug(largeObject);

  log.info("test text");
  log.info(42);
  log.info(largeObject);

  log.verbose("test text");
  log.verbose(42);
  log.verbose(largeObject);
};

for (const { describeName, prepare } of [
  {
    describeName: "log",
    prepare: () => {
      resetLogCorrelationId();
    }
  },
  {
    describeName: "log with correlationId",
    prepare: () => {
      setLogCorrelationId("test-correlation-id");
    }
  }
]) {
  describe(describeName, () => {
    let originalStandardWrite;
    let originalErrorWrite;
    const write = jest.fn().mockImplementation(function(...args) {
      originalStandardWrite.call(this, ...args);
    });
    beforeAll(() => {
      originalStandardWrite = process.stdout.write;
      process.stdout.write = write.bind(process.stdout);
      originalErrorWrite = process.stderr.write;
      process.stderr.write = write.bind(process.stderr);
    });

    afterAll(() => {
      process.stdout.write = originalStandardWrite;
      process.stderr.write = originalErrorWrite;
    });

    beforeEach(() => {
      prepare();
    });

    afterEach(() => {
      delete process.env.DEBUG_LEVEL;
      write.mockClear();
    });

    test(`should not write to scope "test-scope"`, () => {
      const scope = "test-scope";
      const log = getLog(scope);
      writeTestLogs(log);

      expect(prettify(write)).toMatchSnapshot();
    });

    test(`should write to scope "${logRootNamespace}:my-test" (log,error,warn,debug,info)`, () => {
      const log = getLog(`${logRootNamespace}:my-test`);
      writeTestLogs(log);

      expect(prettify(write)).toMatchSnapshot();
    });

    test(`should write to scope "${logRootNamespace}:my-test" (log,error)`, () => {
      process.env.DEBUG_LEVEL = "error";

      const log = getLog(`${logRootNamespace}:my-test`);
      writeTestLogs(log);

      expect(prettify(write)).toMatchSnapshot();
    });

    test(`should write to scope "resolve:*" (log,error,warn,debug,info,verbose) (resolve:*)`, () => {
      process.env.DEBUG = "resolve:*";
      process.env.DEBUG_LEVEL = "verbose";

      const logStorage = getLog(`resolve:storage`);
      const logBus = getLog(`resolve:bus`);
      const logCustomer = getLog(`customer`);

      for (const log of [logStorage, logBus, logCustomer]) {
        writeTestLogs(log);
      }

      expect(prettify(write)).toMatchSnapshot();
    });
  });
}
