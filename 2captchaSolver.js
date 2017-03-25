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
  // request.post('http://bypasscaptcha.com/js_api/js_api.php').form({file:imageData.toString('base64'),key:'ef74af2301e71a7a7f84a4ec32b87a26',
  // submit:'Submit',gen_task_id:1,base64_code:1}
  // ,function(err,res,body){
  //   console.log('fe')
  //   console.log(res);
  // });

  // { "key": key, "file": con, "submit": "Submit", "gen_task_id": 1, "base64_code": 1}
  // captcha.decode(imageData.toString('base64'), {pollingInterval: 10000}, function(err, result, invalid) {
  //   console.log(imageData.toString('base64'))
  //   console.log(result.text)
  //   cb(err, null, result.text);
// });

}

module.exports = solver
