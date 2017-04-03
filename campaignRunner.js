/**
 * Created by Eden on 02/04/2017.
 */
const searcher = require('./googleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');
const utils = require('./utils.js');
const winston = require('winston');

const runner = {};

runner.run = function (campaign) {
    const logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: `./logs/${campaign.title}-${Date.now()}.log`})
        ]
    });
    finder.logger = logger;
    searcher.logger = logger;
    logger.info('Started running...');
    searcher.search(campaign.keywords,campaign.limit).then(function (urls) {
        console.log(urls);
        console.log('there are ' + urls.length + ' pages');
        // TODO: change this to parallel
        async.each(urls, function (url, cb) {
            shouldVisitHost(utils.other.getHostName(url))
                .then(function (shouldVisit) {
                    if (!shouldVisit) {
                        cb("Already visited host");
                    } else {
                        finder.find(url,campaign)
                            .then(function () {
                                addToBlacklist(url);
                                console.log('url:' + url + " sent!");
                                cb();
                            }).catch(function (err) {
                            const error = new Error('url:' + url + " " + JSON.stringify(err));
                            logger.error(error);
                            cb(error);
                        });
                    }
                }).catch(function (err) {
                cb(err)
            });

        }, function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
                console.log('not all pages finished');
            } else {
                console.log('check2');
                logger.info("all pages finshed");
            }
        });
    }).catch(function (err) {
        logger.error(JSON.stringify(err));
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