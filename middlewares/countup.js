'use strict';

const promisify = require("es6-promisify");

const winston = require('winston');
const MiddlewareBase = require('./middleware_base');

class Countup extends MiddlewareBase {
  constructor(...args) {
    super(...args);
    this.counters = this.options.counters;
    this.redisCmd = this.options.redisCmd;
    this.publisher = this.options.publisher;
  }

  incr(counterName) {
    winston.info('countup', counterName);
    const ret = this.redisCmd.incr(counterName);
    this.publisher.publish('countup', counterName);
    return ret;
  }

  process(message) {
    if (!message.hasOwnProperty('name')) {
      return Promise.reject(new Error('[Counter] message has no counter field'));
    }
    let counterName = message['name'];
    if (!this.counters.has(counterName)) {
      return Promise.reject(new Error('[Counter] no such counter'));
    }
    return this.incr(counterName).then((result) => {
      console.log(result);
    }, console.error);
  }
}

module.exports = Countup;

if (!module.parent) {
  const assert = require('assert');
  let countup = new Countup({
    redis: {},
    counters: new Map().set('saikoh', '最高')
  });
  countup.process({ counter_name: 'saikoh' }).catch((err) => {
    console.error(err);
  });
}
