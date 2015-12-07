'use strict';

const CONFIG = require('./config');

const path = require('path');
const http = require('http');
const winston = require('winston');
const ws = require('ws');
const StaticServer = require('node-static').Server;
const WebSocketServer = ws.Server;
const redis = require('redis');
const promisify = require("es6-promisify");

const middlewares = require('./middlewares');

const redisClient = redis.createClient(CONFIG.redis);
const COUNTERS = CONFIG.counters.reduce((map, kv) => map.set(kv.name, kv.title), new Map());

const MIDDLEWARE_STACK = [
  new middlewares.Countup({
    counters: COUNTERS,
    redis: redisClient,
  }),
];

const fileServer = new StaticServer(
  path.join(__dirname, './public'),
  { cache: 0 }
);

const server = http.createServer((req, res) => {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8124);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  Promise.all(Array.from(COUNTERS.entries()).map(([name, title]) => {
    return {name, title};
  }).map(({name, title}) => {
    return promisify(this.redis.get.bind(this.redis))().then((value) => {
      return {name, title, count: value || 0};
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
