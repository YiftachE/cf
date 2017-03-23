var scraper = require('google-search-scraper');
var DeathByCaptcha = require('deathbycaptcha');
var async = require('async')

var dbc = new DeathByCaptcha('edenfisher', '123456');
var options = {
  limit: 10
};

var searcher = {};
searcher.search = function(keyword) {
  options.query = keyword;
  return new Promise(function(resolve,reject) {
    var results = [];
    var errors = [];
    scraper.search(options, function(err, url) {
      if(err) {
        reject(err);
      }
      else {
        results.push(url)
      };
      if(results.length + errors.length == options.limit) {
        resolve({results:results,errors:errors});
      }
    });
  });
}
 module.exports = searcher;
