var request = require('request');
var cheerio = require('cheerio');


var finder = {};

finder.find = function(url) {
  console.log(url)
  return new Promise(function(resolve,reject) {
    console.log(url);
    request(url, function(error, response, html){
            // First we'll check to make sure no errors occurred when making the request
            if(!error){
                // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
                var $ = cheerio.load(html);
                var shit = $('a:contains("contact")');
                if (shit.length > 0) {
                    
                }
                console.log(shit)
            } else {
              reject(error);
            }
        })
  })
};

var searchForm = function () {

};

module.exports = finder;
