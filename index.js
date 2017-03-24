var searcher = require('./googleSearcher.js');
var finder = require('./contactUsFinder.js');
var async = require('async')

searcher.search('nirel').then(function(urls) {
  async.each(urls.results,function(url,cb){
    finder.find(url).then(function(){
      cb();
    }).catch(function(err){
      cb(err);
    })
  },function(err){
    if(err) {
      console.log(err);
    } else {
      console.log('all pages finshed');
    }
  });
}).catch(function(err){
  console.log(err);
});
