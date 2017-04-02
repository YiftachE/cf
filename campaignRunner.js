/**
 * Created by Eden on 02/04/2017.
 */
const searcher = require('./googleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');
const utils = require('./utils.js');
const winston = require('winston');

const runner = {};

runner.run = function (words) {
    const logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: `./logs/campaignname-${Date.now()}.log` })
        ]
    });
    logger.info('Started running...');
    searcher.search(words).then(function (urls) {
        console.log(urls);
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
                logger.error(err);
                console.log('not all pages finished');
            } else {
                logger.info("all pages finshed");
            }
        });
    }).catch(function (err) {
        logger.error(err);
    });
};


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

module.exports = runner;