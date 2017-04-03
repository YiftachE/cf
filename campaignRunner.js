/**
 * Created by Eden on 02/04/2017.
 */
const searcher = require('./googleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');
const utils = require('./utils.js');
const winston = require('winston');

const runner = {};

runner.run = function (campaign,limit) {
    const curTime = Date.now();
    const logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: `./logs/${campaign.title}-${curTime}.log`})
        ]
    });
    const reportData = {};
    reportData.cfSentNumber = 0;
    reportData.noCfNumber = 0;
    reportData.blockedByBLNumber = 0;
    finder.logger = logger;
    searcher.logger = logger;
    logger.info('Started running...');
    searcher.search(campaign.keywords,limit).then(function (urls) {
        reportData.sitesVisitedNumber = urls.length;
        console.log(urls);
        console.log('there are ' + urls.length + ' pages');
        // TODO: change this to parallel
        async.map(urls, async.reflect(function (url, cb) {
            shouldVisitHost(utils.other.getHostName(url))
                .then(function (shouldVisit) {
                    if (!shouldVisit) {
                        reportData.blockedByBLNumber +=1;
                        cb("Already visited host");
                    } else {
                        finder.find(url,campaign)
                            .then(function () {
                                addToBlacklist(url);
                                reportData.cfSentNumber +=1;
                                logger.info('url:' + url + " sent!");
                                cb();
                            }).catch(function (err) {
                            // if (err & err.text === "Couldn't find form") {
                            //
                            // } else if (err & err.text === "Couldn't find contact us") {
                            //
                            // }
                            reportData.noCfNumber +=1;
                            const error = new Error('url:' + url + " " + JSON.stringify(err));
                            logger.error(error);
                            cb(error);
                        });
                    }
                }).catch(function (err) {
                cb(err)
            });

        }), function (err,results) {
            console.log(results);
            utils.other.createReport(reportData,curTime,campaign.title);
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