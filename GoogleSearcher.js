var scraper = require('google-search-scraper');
var solver = require('./2captchaSolver.js')
// DeathByCaptcha = require("deathbycaptcha");
// var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

var options = {
  limit: 10,
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
        console.log(err)
      }
      else {
        results.push(url)
      };
      // if(results.length + errors.length == options.limit) {
      //   resolve({results:results,errors:errors});
      // }
      resolve({results:['http://www.nirel.org.il/',
                        'https://www.goodreads.com/author/show/15413697.Nirel',
                        'http://www.babynamespedia.com/meaning/Nirel/m',
                        'http://www.saavn.com/s/album/tulu/Nirel-2015/YKYJL8VlOZM_',
                        'https://wn.com/Nirel',
                        'http://www.bellevision.com/belle/index.php?action=topnews&type=5845',
                        'http://nirel.deviantart.com/',]
            })
    });
  });
}
 module.exports = searcher;
