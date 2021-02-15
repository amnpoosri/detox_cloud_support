const chalk = require('chalk').default;
const { traceln } = require('./utils/stdout');
const logger = require('../../src/utils/logger');
const log = logger.child();

const RESULT_SKIPPED = chalk.yellow('SKIPPED');
const RESULT_FAILED = chalk.red('FAIL');
const RESULT_PENDING = chalk.yellow('PENDING');
const RESULT_SUCCESS = chalk.green('OK');
const RESULT_OTHER = 'UNKNOWN';

class SpecReporter {
  constructor() {
    this._suites = [];
    this._suitesDesc = '';
  }

  onSuiteStart({description}) {
    this._suites.push({description});
    this._regenerateSuitesDesc();
  }

  onSuiteEnd() {
    this._suites.pop();
    this._regenerateSuitesDesc();

    if (!this._suites.length) {
      traceln('');
    }
  }

  onTestStart({description, invocations = 1}) {
    if(/^(debug|trace)$/.test(logger.getDetoxLevel())) {
      this._traceTest({description, invocations});
    }
  }

  onTestEnd({description, invocations = 1}, result) {
    let status;
    switch (result) {
      case 'skipped': status = RESULT_SKIPPED; break;
      case 'failed': status = RESULT_FAILED; break;
      case 'pending': status = RESULT_PENDING; break;
      case 'success': status = RESULT_SUCCESS; break;
      default: status = RESULT_OTHER; break;
    }
    this._traceTest({description, invocations}, status);
  }

  _regenerateSuitesDesc() {
    this._suitesDesc = '';

    const total = this._suites.length;
    this._suites.forEach((suite, index) => {
      this._suitesDesc = this._suitesDesc
        .concat((index > 0) ? ' > ' : '')
        .concat(suite.description)
        .concat((index === total - 1) ? ': ' : '');
    });
    this._suitesDesc = chalk.bold.white(this._suitesDesc);
  }

  _traceTest({description, invocations}, _status = undefined) {
    if(_status === RESULT_SKIPPED && !/^(debug|trace)$/.test(logger.getDetoxLevel())) {
      return;
    }
    
    const testDescription = chalk.gray(description);
    const retriesDescription = (invocations > 1) ? chalk.gray(` [Retry #${invocations - 1}]`) : '';
    const status = chalk.gray(_status ? ` [${_status}]` : '');
    const desc = this._suitesDesc + testDescription + retriesDescription + status;
    
    const loggingFunc = _status === RESULT_FAILED ? log.error.bind(log) : log.info.bind(log);
    loggingFunc({event: 'SPEC_STATE_CHANGE'}, desc);
  }
}

module.exports = SpecReporter;
