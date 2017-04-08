const winston = require('winston');
var handler = require('./rest/express');
require('events').EventEmitter.defaultMaxListeners = Infinity;
winston.add(winston.transports.File, { filename: './logs/main.log' });
handler.listen();