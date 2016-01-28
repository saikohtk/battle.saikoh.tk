'use strict';

const config = require('config');
const redis = require('redis');
const commands = require('redis-commands');
const promisify = require("es6-promisify");

const redisClient = redis.createClient(config.get('redis'));

module.exports = commands.list
  .map((cmd) => [cmd, promisify(redisClient[cmd].bind(redisClient))])
  .reduce((obj, [cmd, method]) => Object.assign(obj, {[cmd]: method}), {});
