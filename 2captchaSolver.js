// var captcha = require('2captcha');
// captcha.setApiKey('c1914077589a4539fdd30ef2f851a236');
// var request = require('request');
DeathByCaptcha = require("deathbycaptcha");
var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

var solver = {}

solver.solve = function(imageData,cb) {
  dbc.solve(imageData,function(err,id,solution){
    if(err) {
      console.log(err)
    } else {
      cb(solution);
    }
  })
}

module.exports = solver
