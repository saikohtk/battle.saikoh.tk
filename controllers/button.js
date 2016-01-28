'use strict';

const BaseController = require('./base');
const Counter = require('../models/counter');

// FIXME:
const saikoh = new Counter('saikoh', '最高');

class ButtonController extends BaseController {
  _onConnection() {
    this._send('counters', {
      counters: [{
        counter_name: saikoh.name,
        counter_value: saikoh.value,
        counter_title: saikoh.title,
      }]
    });
  }

  _onMessage(type, message) {
    switch (type) {
    case 'update':
      if (message['counter_name'] !== 'saikoh') { return; }
      saikoh.countup();
      break;
    }
  }
}

module.exports = ButtonController;
