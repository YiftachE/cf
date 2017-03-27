var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var handler = {};

app.get('/', function(req, res){
  res.send('server is here');
});

app.post('/newProject', function(req, res){
  res.send(`new project here - ${req.body.projectName}`);
});

handler.listen = function(){
  app.listen(3001);
  console.log('server is listening on port 3001');
}

module.exports = handler;
