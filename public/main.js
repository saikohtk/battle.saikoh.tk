(function () {
  'use strict';

  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.navigator.vibrate = window.navigator.vibrate || function () {};

  var audioContext = new AudioContext();
  var gainNode = audioContext.createGain();
  gainNode.gain.value = 0.8;
  gainNode.connect(audioContext.destination);

  function E (tagName, attrs, children) {
    var el = document.createElement(tagName);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      el.appendChild(child);
    });

    return el;
  }

  function T (text) {
    return document.createTextNode(text);
  }

  //----------

  function fetchFile (path) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', path, true);
      request.responseType = 'arraybuffer';
      request.onload = function () {
        resolve(request.response);
      };
      request.onerror = function () {
        reject(err)
      };

      request.send();
    });
  }

  function Counter (data) {
    this.$btn = document.getElementById('btn-saikoh');
    if (document.getElementById('counter')) {
      this.$value = T(data.counter_value.toString());
      document.getElementById('counter').appendChild(this.$value);
    }

    this.buffer = null;
    this.history = [];

    fetchFile("/audio/saikoh.mp3").then(function (data) {
      audioContext.decodeAudioData(data, function (buffer) {
        counter.buffer = buffer;
      });
      this.$btn.removeAttribute('disabled');
    }.bind(this));

    var onClick = function (e) {
      cmd.countup('saikoh');
      this.play();
      window.navigator.vibrate(100);
    }.bind(this);
    this.$btn.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    }, false);
    this.$btn.addEventListener('click', onClick, false);
  }

  Counter.prototype.update = function (value) {
    this.history.unshift({ value: value, timestamp: new Date() });
    if (this.$value) { this.$value.nodeValue = value; }
  };

  Counter.prototype.play = function () {
    var source = audioContext.createBufferSource();
    source.connect(gainNode);
    source.buffer = this.buffer;
    source.start();
  };

  Counter.prototype.instantaneousSpeed = function () {
    var now = new Date();

    for (var i = this.history.length - 1; i >= 0; i--) {
      if (now - this.history[i].timestamp > 1000) {
        this.history.pop();
      } else {
        break;
      }
    }

    return this.history.length;
  };

  //----------

  var counter = null;

  var cmd = function () {
    var ws = new ReconnectingWebSocket(window.location.protocol === 'https:' ? 'wss://' : 'ws://' + window.location.host + '/api/button');
    ws.onmessage = function (e) {
      var signal = JSON.parse(e.data);
      onSignal(signal);
    };
    return {
      countup: function (name) {
        ws.send(JSON.stringify({type: 'update', counter_name: name}));
      }
    };
  }();

  function onSignal (signal) {
    switch (signal.type) {
    case 'counters':
      if (counter === null) {
        counter = new Counter(signal.counters[0]);
      }
      break;
    case 'changed':
      counter.update(signal.counter_value);
      break;
    }
  }
})();
