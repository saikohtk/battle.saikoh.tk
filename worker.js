'use strict';

const config = require('config');
const path = require('path');
const http = require('http');
const winston = require('winston');
const promisify = require("es6-promisify");
const ws = require('ws');
const StaticServer = require('serve-static')
const WebSocketServer = ws.Server;
const Router = require('router-line').Router;

winston.level = 'debug';

const fileServer = new StaticServer(
  path.join(__dirname, './public')
);

const router = new Router();

const PORT = config.get('port');
const server = http.createServer((req, res) => {
  fileServer(req, res);
});

const ButtonController = require('./controllers/button');
const FeedController = require('./controllers/feed');
router.GET('/api/button', ButtonController);
router.GET('/api/feed', FeedController);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  winston.info('connected');
  const match = router.route(req.method, req.url);
  if (match === undefined) { ws.close(); return; }
  const {params, value} = match;

  const ctrl = new value(ws);
});

server.listen(PORT);
winston.info(`started listening on port ${PORT}`);
