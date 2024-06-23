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

  //----------

  function Counter (data) {
    this.$btn = document.getElementById('btn-saikoh');
    if (document.getElementById('counter')) {
      this.$value = T(data.counter_value.toString());
      document.getElementById('counter').appendChild(this.$value);
    }

    this.buffer = null;
    this.history = [];
  }

  Counter.prototype.update = function (value) {
    this.history.unshift({ value: value, timestamp: new Date() });
    this.$value.nodeValue = value;
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
    var ws = new ReconnectingWebSocket(window.location.protocol === 'https:' ? 'wss://' : 'ws://' + window.location.host + '/api/feed');
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
      text: ''
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
        text: null
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

        for (i = -30; i <= 0; i += 1) {
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
