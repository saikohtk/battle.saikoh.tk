'use strict';

const promisify = require("es6-promisify");

const MiddlewareBase = require('./middleware_base');

class Countup extends MiddlewareBase {
  constructor(...args) {
    super(...args);
    this.redis = this.options.redis;
    this.counters = this.options.counters;
  }

  incr(counterName) {
    return promisify(this.redis.incr.bind(this.redis))(counterName);
  }

  process(message) {
    if (!message.hasOwnProperty('counter_name')) {
      return Promise.reject(new Error('[Counter] message has no counter field'));
    }
    let counterName = message['counter_name'];
    if (!this.counters.has(counterName)) {
      return Promise.reject(new Error('[Counter] no such counter'));
    }
    return this.incr(counterName).then((result) => {
      console.log(result);
    });
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
