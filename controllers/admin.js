'use strict';

const BaseController = require('./base');
const Counter = require('../models/counter');
const pubsub = require('../models/pubsub');

// FIXME:
const saikoh = new Counter('saikoh', '最高');

class AdminController {
  _onConnection() {
    this._onCOpen = () => {
      this._send('open', {});
    };
    this._onCClose = () => {
      this._send('close', {});
    };
    pubsub.on('admin::open', this._onCOpen);
    pubsub.on('admin::close', this._onCClose);
  }

  _onClose() {
    pubsub.removeListener('admin::open', this._onCOpen);
    pubsub.removeListener('admin::close', this._onCClose);
  }

  _onMessage(type, message) {
    switch (type) {
    case 'reset':
      saikoh.reset(message.memo);
      break;
    case 'snapshot':
      saikoh.snapshot(message.memo);
      break;
    case 'close':
      saikoh.close(message.memo);
      break;
    case 'open':
      saikoh.open(message.memo);
      break;
    }
  }
}

module.exports = AdminController;
