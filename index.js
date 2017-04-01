const searcher = require('./googleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');
const utils = require('./utils.js');


searcher.search('eden').then(function (urls) {
    console.log('there are ' + urls.length + ' pages');
    async.each(urls, function (url, cb) {
        shouldVisitHost(utils.other.getHostName(url))
            .then(function (shouldVisit) {
                if (!shouldVisit) {
                    cb("Already visited host");
                } else {
                    finder.find(url)
                        .then(function () {
                            addToBlacklist(url);
                            console.log('url:' + url + " sent!");
                            cb();
                        }).catch(function (err) {
                        const error = new Error('url:' + url + " " + err);
                        console.log(error);
                        cb(error);
                    });
                }
            }).catch(function (err) {
            cb(err)
        });

    }, function (err) {
        if (err) {
            console.log('not all pages finished');
        } else {
            console.log('all pages finshed');
        }
    });
}).catch(function (err) {
    // console.log(err);
});


const shouldVisitHost = function (hostname) {
    return new Promise(function (resolve, reject) {
        resolve(true);
    });
};
const addToBlacklist = function (url) {
    const hosname = utils.other.getHostName(url);
    return new Promise(function (resolve, reject) {
        resolve();
    });
};

