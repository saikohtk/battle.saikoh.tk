'use strict';

class MiddlewareBase {
  constructor(options) {
    this.options = options;
  }

  process(message) {
    return Promise.resolve(message);
  }
}

module.exports = MiddlewareBase;
