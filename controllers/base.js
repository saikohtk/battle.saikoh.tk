'use strict';

const winston = require('winston');

class BaseController {
  constructor(ws) {
    this.ws = ws;
    this._onMessageString = this._onMessageString.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onError = this._onError.bind(this);
    this.ws.on('message', this._onMessageString);
    this.ws.on('close', this._onClose);
    this.ws.on('error', this._onError);

    this._onConnection();
  }

  _onMessageString(messageString) {
    try {
      const message = JSON.parse(messageString);
      this._onMessage(message.type, message);
    } catch (err) {
      winston.warning(err);
    }
    this._onMessage();
  }

  _onMessage() {
    // NOOP
  }

  _onClose() {
    this.ws.removeListener('message', this._onMessageString);
    this.ws.removeListener('close', this._onClose);
    this.ws.removeListener('error', this._onError);
  }

  _onError(err) {
    winston.error(err);
    process.exit(1);
  }

  _send(type, payload) {
    this.ws.send(JSON.stringify(Object.assign({}, payload, {type})), {compress: false});
  }
}

module.exports = BaseController;
