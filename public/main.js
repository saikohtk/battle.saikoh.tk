(function () {
  'use strict';

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

  var counters = [];

  var cmd = function () {
    var ws = new ReconnectingWebSocket('ws://' + window.location.host);
    ws.onmessage = function (e) {
      var signal = JSON.parse(e.data);
      onSignal(signal);
    };
    return {
      countup: function (name) {
        ws.send(JSON.stringify({type: 'countup', name: name}));
      }
    };
  }();

  function onSignal (signal) {
    switch (signal.type) {
    case 'counters':
      construct(signal.counters);
      break;
    case 'update':
      counters[signal.name].update(signal.value);
      break;
    }
  }

  function construct (receivedCounters) {
    var $counters = receivedCounters.map(function (counter) {
      var $value = T(counter.count.toString());
      var $btn = E('img', { src: 'http://placehold.it/300x300' });
      var $elem = (
        E('tr', {}, [
          E('td', {}, [$btn]),
          E('td', {}, [
            E('span', { class: 'count' }, [$value]),
            T(counter.title)
          ])
        ])
      );
      counters[counter.name] = {
        update: function (value) {
          $value.nodeValue = value;
        }
      };
      $btn.addEventListener('click', function (e) {
        cmd.countup(counter.name);
      }, false);
      return $elem;
    }, {});
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    document.body.appendChild(E('table', {}, $counters));
  }
})();
