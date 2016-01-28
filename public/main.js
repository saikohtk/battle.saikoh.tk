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
    this.history.push({ value: value, timestamp: new Date() });
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
    var speed = this.history.filter(function (event) {
      return now - event.timestamp <= 1000;
    }).length;

    return speed;
  };

  //----------

  var counter = null;

  var cmd = function () {
    var ws = new ReconnectingWebSocket('ws://' + window.location.host);
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

  //----------

  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });

  var chart = new Highcharts.chart({
    chart: {
      renderTo: 'chart',
      type: 'areaspline',
      animation: {
        duration: 250
      },
      marginRight: 10,
      events: {
        load: function () {

          // set up the updating of the chart each second
          var series = this.series[0];
          setInterval(function () {
            var x = (new Date()).getTime(), // current time
              y = counter.instantaneousSpeed();
            series.addPoint([x, y], true, true);
          }, 500);
        }
      }
    },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, Highcharts.getOptions().colors[5]],
            [1, Highcharts.Color(Highcharts.getOptions().colors[5]).setOpacity(0).get('rgba')]
          ]
        },
        marker: {
          radius: 2,
          fillColor: "#000000"
        },
        lineWidth: 3,
        lineColor: Highcharts.getOptions().colors[5],
        states: {
          hover: {
            lineWidth: 1
          }
        },
        threshold: null
      }
    },
    title: {
      text: '瞬間最高'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      min: 0,
      minRange: 20,
      minTickInterval: 5,
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 2,
        color: "#000000"
      }],
      labels: {
        style: {
          fontSize: '30px'
        }
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
          Highcharts.numberFormat(this.y, 2);
      }
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Random data',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -19; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });


})();
