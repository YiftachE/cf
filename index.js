const searcher = require('./googleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');

searcher.search('digital marketing').then(function (urls) {
    console.log('there are ' + urls.length + ' pages');
    async.each(urls, function (url, cb) {
        finder.find(url).then(function () {
            console.log('url:' + url + " sent!");
            cb();
        }).catch(function (err) {
            const error = new Error('url:' + url + " " + err);
            console.log(error);
            cb(error);
        });
    }, function (err) {
        if (err) {
            console.log('not all pages finished');
        } else {
            console.log('all pages finshed');
        }
    });
}).catch(function (err) {
    console.log(err);
});
