/**
 * Created by Eden on 02/04/2017.
 */
const searcher = require('./GoogleSearcher.js');
const finder = require('./contactUsFinder.js');
const async = require('async');
const utils = require('./utils.js');
const winston = require('winston');
const database = require('./db/databaseHandler');

const runner = {};

runner.run = function (campaign, limit) {
    const curTime = Date.now();
    const logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)(),
            new(winston.transports.File)({
                filename: `./logs/${campaign.title}-${curTime}.log`
            })
        ]
    });
    const reportData = {};
    reportData.cfSentNumber = 0;
    reportData.noCfNumber = 0;
    reportData.blockedByBLNumber = 0;
    finder.logger = logger;
    searcher.logger = logger;
    logger.info('Started running...');
    searcher.search(campaign.keywords, limit).then(function (urls) {
        reportData.sitesVisitedNumber = urls.length;
        // TODO: change this to parallel
        let connection = database.create();
        async.mapLimit(urls,5, async.reflect(function (url, cb) {
            shouldVisitHost(connection, utils.other.getHostName(url.link), campaign)
                .then(function (shouldVisit) {
                    if (!shouldVisit) {
                        reportData.blockedByBLNumber += 1;
                        cb("Already visited host");
                    } else {
                        finder.find(url.link, campaign)
                            .then(function () {
                                addToBlacklist(url.link, campaign,connection);
                                reportData.cfSentNumber += 1;
                                logger.info('url:' + url.link + " sent!");
                                cb();
                            }).catch(function (err) {
                                // if (err & err.text === "Couldn't find form") {
                                //
                                // } else if (err & err.text === "Couldn't find contact us") {
                                //
                                // }
                                reportData.noCfNumber += 1;
                                const error = new Error('url:' + url + " " + JSON.stringify(err));
                                logger.error(error);
                                cb(error);
                            });
                    }
                }).catch(function (err) {
                    utils.other.createReport(reportData, curTime, campaign.title);
                    console.log(err)
                    cb(err)
                });

        }), function (err, results) {
            console.log(results);
            utils.other.createReport(reportData, curTime, campaign.title);
        });
    }).catch(function (err) {
        logger.error(JSON.stringify(err));
    });
};


const shouldVisitHost = function (connection, hostname, campaign) {
    return new Promise(function (resolve, reject) {
        database.createBlackListModel(connection).then(function (model) {
            database.checkExists(model, hostname).then(function (existsInGeneral) {
                database.createPrivateBlackList(connection).then(function (model) {
                    database.checkIfSiteBlockedForCampaign(model, hostname, campaign.title).then(function (existsInCampaign) {
                        resolve(!existsInCampaign && !existsInGeneral)
                    }).catch(err => console.log());
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    });
};
const addToBlacklist = function (url, campaign,connection) {
    const hosname = utils.other.getHostName(url);
    return new Promise(function (resolve, reject) {
        database.createPrivateBlackList(connection).then(function (model) {
            database.addToPrivateBlackList(model, {
                site: hosname,
                campaign: campaign.title
            }).then(function () {
                resolve();
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

module.exports = runner;