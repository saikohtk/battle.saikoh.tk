'use strict';

const CONFIG = require('./config');

const path = require('path');
const http = require('http');
const winston = require('winston');
const promisify = require("es6-promisify");
const ws = require('ws');
const StaticServer = require('node-static').Server;
const WebSocketServer = ws.Server;

winston.level = 'debug';

const redis = require('redis');
const redisClient = redis.createClient(CONFIG.redis.url || process.env.REDIS_URL);
const redisCmd = ['get', 'incr']
        .map((cmd) => [cmd, promisify(redisClient[cmd].bind(redisClient))])
        .reduce((obj, [cmd, method]) => Object.assign(obj, {[cmd]: method}), {});
const publisher = redis.createClient(CONFIG.redis.url || process.env.REDIS_URL);
const subscriber = redis.createClient(CONFIG.redis.url || process.env.REDIS_URL);

const middlewares = require('./middlewares');

const COUNTERS = CONFIG.counters.reduce((map, kv) => map.set(kv.name, kv.title),
                                        new Map());

const MIDDLEWARE_STACK = [
  new middlewares.Countup({
    counters: COUNTERS,
    redisCmd: redisCmd,
    publisher: publisher,
  }),
];

const fileServer = new StaticServer(
  path.join(__dirname, './public'),
  { cache: 0 }
);

const PORT = process.env.PORT || 8124;
const server = http.createServer((req, res) => {
  fileServer.serve(req, res);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  winston.info('connected');
  Promise.all(Array.from(COUNTERS.entries()).map(([name, title]) => {
    return redisCmd.get(name).then((value) => {
      return {
        counter_name: name,
        counter_title: title,
        counter_value: value || 0
      };
    });
  })).then((counters) => {
    ws.send(JSON.stringify({
      type: 'counters',
      counters,
    }));
  });

  ws.on('message', (messageString) => {
    let message = null;
    try {
      message = JSON.parse(messageString);
    } catch (err) {
      winston.error(err.toString());
    }
    MIDDLEWARE_STACK.reduce((message, middleware) => {
      return message.then(middleware.process.bind(middleware));
    }, Promise.resolve(message));
  });
});

subscriber.subscribe('countup');
subscriber.on('message', (channel, name) => {
  console.log(channel, name);
  if (channel !== 'countup') { return; }
  redisCmd.get(name).then((value) => {
    for (let client of wss.clients) {
      client.send(JSON.stringify({
        type: 'changed',
        counter_name: name,
        counter_value: value || 0
      }));
    }
  });
});

server.listen(PORT, '0.0.0.0');
winston.info(`started listening on port ${PORT}`);
