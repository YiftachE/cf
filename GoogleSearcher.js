var scraper = require('google-search-scraper');
var solver = require('./2captchaSolver.js')

var options = {
  limit: 100,
  solver:solver
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
