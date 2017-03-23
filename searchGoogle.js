var google = require('google')
var findContact = require('./findContactUs');
async = require('async');
var asyncTasks = [];

google.resultsPerPage = 5
var nextCounter = 0

google('brusher', function (err, res){
  if (err) console.error(err)

  for (var i = 0; i < res.links.length; ++i) {
    var link = res.links[i];

    if(link.link){
      console.log('adding new link - ' + link.href);
      asyncTasks.push(findContact(link.href));
    }
  }

  async.parallel(asyncTasks, function(){
    console.log('all completed');
  });

  if (nextCounter < 1) {
    nextCounter += 1
    if (res.next) res.next()
  }
})
