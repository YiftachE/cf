// var captcha = require('2captcha');
// captcha.setApiKey('c1914077589a4539fdd30ef2f851a236');
// var request = require('request');
DeathByCaptcha = require("deathbycaptcha");
var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

var solver = {}

solver.solve = function (imageData) {
  return new Promise(function (resolve, reject) {
    dbc.solve(imageData, function (err, id, solution) {
      if (err) {
        reject(err);
      } else {
        resolve(solution)
      }
    });
  })

}

module.exports = solver