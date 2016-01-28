'use strict';

const events = require('events');
const winston = require('winston');
const config = require('config');
const promisify = require("es6-promisify");
const pubsub = require('./pubsub');
const redis = require('./redis');

const HASH_NAME = 'state';

class State extends events.EventEmitter {
  constructor(key) {
    super();
    this.key = key;
    this._value = null;
    this.isReady = false;

    this.eventName = `state::${key}`;
    pubsub.on(this.eventName, this._onChange.bind(this));
    this._onChange();
  }

  _onChange() {
    return this._getValue().then(this._updateValueLocally.bind(this));
  }

  _getValue() {
    return redis.hget(HASH_NAME, this.key);
  }

  _updateValueLocally(value) {
    if (!this.isReady) {
      this.isReady = true;
      this.emit('ready', this.value);
    }
    if (this.value === value) { return; }
    this._value = value;
    this.emit('value', this.value);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    redis.hset(HASH_NAME, this.key, value).then(() => {
      pubsub.emit(this.eventName);
    }).catch(winston.error);
  }
}

if (!module.parent) {
  const state1 = new State('foobar');
  const state2 = new State('foobar');

  state1.on('value', value => console.log('!', value));
  state1.value = 'hoge';
  state2.value = 'hoge2';
}
