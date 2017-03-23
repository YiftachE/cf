var searcher = require('./googleSearcher.js');
searcher.search('eden').then(function(urls) {
  console.log(urls);
}).catch(function(err){
  console.log(err);
});
