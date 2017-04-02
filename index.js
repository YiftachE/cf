const winston = require('winston');
var handler = require('./rest/express');
winston.add(winston.transports.File, { filename: './logs/main.log' });
handler.listen();