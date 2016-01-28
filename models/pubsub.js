'use strict';

const config = require('config');
const events = require('events');
const redis = require('redis');
const pub = redis.createClient(config.get('redis'));
const sub = redis.createClient(config.get('redis'));

const CHANNEL_NAME = 'EE_CHANNEL';

class PubSub extends events.EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(Infinity);
    sub.subscribe(CHANNEL_NAME);
    sub.on('message', (channel, payloadJson) => {
      if (channel !== CHANNEL_NAME) { return; }
      const {event, args} = JSON.parse(payloadJson);
      super.emit(event, ...args);
    });
  }

  emit(event, ...args) {
    pub.publish(CHANNEL_NAME, JSON.stringify({event, args}));
  }
}

const pubsub = new PubSub();

module.exports = pubsub;

if (!module.parent) {
  pubsub.on('hoge', (...args) => {
    console.log(args);
  });

  pubsub.emit('hoge', 'hey', 'boo');
}
