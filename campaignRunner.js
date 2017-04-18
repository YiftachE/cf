/**
 * Created by Eden on 02/04/2017.
 */
const searcher = require('./GoogleSearcher.js');
const async = require('async');
const utils = require('./utils.js');
const winston = require('winston');

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

    searcher.logger = logger;
    logger.info('Started running...');
    searcher.search(campaign, limit).then(function (reports) {
        let reps = [reports[0],reports[0]]
        let init = {};
        init.sitesVisitedNumber=0;
        init.cfSentNumber=0;
        init.blockedByBLNumber=0;
        init.noCfNumber=0;
        let aggReport=reps.reduce(function (aggReport, obj) {
            let curReport=obj.v;
            report.sitesVisitedNumber += curReport.sitesVisitedNumber;
            report.cfSentNumber += curReport.cfSentNumber;
            report.blockedByBLNumber += curReport.blockedByBLNumber;
            report.noCfNumber += curReport.noCfNumber;
        },init);
        utils.other.createReport(aggReport, curTime, campaign.title);

    }).catch(function (err) {
        logger.error(JSON.stringify(err));
    });
};


module.exports = runner;