const winston = require('winston');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
for (var i = 0; i < numCPUs; i++) {
  cluster.fork();
}

cluster.on('exit', (worker, code, signal) => {
  winston.error(`worker ${worker.process.pid} died`);
  cluster.fork();
});
