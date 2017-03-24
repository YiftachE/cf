var captcha = require('2captcha');
captcha.setApiKey('c1914077589a4539fdd30ef2f851a236');

var solver = {}

solver.solve = function(imageData,cb) {
  captcha.decode(imageData.toString('base64'), {pollingInterval: 10000}, function(err, result, invalid) {
    console.log(imageData.toString('base64'))
    console.log(result.text)
    cb(err, null, result.text);
});

}

module.exports = solver
