'use strict';

const BaseController = require('./base');
const Counter = require('../models/counter');

// FIXME:
const saikoh = new Counter('saikoh', '最高');

class FeedController extends BaseController {
  _onConnection() {
    this._send('counters', {
      counters: [{
        counter_name: saikoh.name,
        counter_value: saikoh.value,
        counnter_title: saikoh.title,
      }]
    });
    this._onValue = this._onValue.bind(this);
    saikoh.on('value', this._onValue);
  }

  _onValue(value) {
    this._send('changed', {
      counter_name: saikoh.name,
      counter_value: saikoh.value,
      counter_title: saikoh.title,
    });
  }

  _onClose() {
    super._onClose();
    saikoh.removeListener('value', this._onValue);
  }
}

module.exports = FeedController;
