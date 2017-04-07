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
      console.log('searching google...!');
        reportData.sitesVisitedNumber = urls.length;
        console.log(urls);
        // TODO: change this to parallel
        async.map(urls, async.reflect(function (url, cb) {
          console.log('inside async.map');
            shouldVisitHost(utils.other.getHostName(url),campaign)
                .then(function (shouldVisit) {
                  console.log('inside should visit..' + shouldVisit);
                    if (!shouldVisit) {
                        reportData.blockedByBLNumber +=1;
                        cb("Already visited host");
                    } else {
                      console.log('should visit site');
                        finder.find(url,campaign)
                            .then(function () {
                              console.log('adding visited site to black list');
                                addToBlacklist(url,campaign);
                                reportData.cfSentNumber +=1;
                                logger.info('url:' + url + " sent!");
                                cb();
                            }).catch(function (err) {
                            // if (err & err.text === "Couldn't find form") {
                            //
                            // } else if (err & err.text === "Couldn't find contact us") {
                            //
                            // }
                            console.log('we have an error visiting site!');
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
            winston.info("Finished running");
            utils.other.createReport(reportData,curTime,campaign.title);
        });
    }).catch(function (err) {
        logger.error(JSON.stringify(err));
    });
};


const shouldVisitHost = function (hostname,campaign) {
    return new Promise(function (resolve, reject) {
        database.createBlackListModel().then(function (model) {
            database.checkExists(model, hostname).then(function (existsInGeneral) {
                database.createPrivateBlackList().then(function (model) {
                    database.checkIfSiteBlockedForCampaign(model, hostname, campaign.title).then(function (existsInCampaign) {
                        resolve (!existsInCampaign && !existsInGeneral)
                    }).catch(err=>reject(err));
                }).catch(err=>reject(err));
            }).catch(err=>reject(err));
        }).catch(err=>reject(err));
    });
};
const addToBlacklist = function (url,campaign) {
    const hosname = utils.other.getHostName(url);
    return new Promise(function (resolve, reject) {
        database.createPrivateBlackList().then(function (model) {
            database.addToPrivateBlackList(model, {site: hosname, campaign: campaign.title}).then(function () {
                resolve();
            }).catch(err=>reject(err));
        }).catch(err=>reject(err));
    });
};

module.exports = runner;
