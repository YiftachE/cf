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
                filename: `./logs/${campaign.name}-${curTime}.log`
            })
        ]
    });

    searcher.logger = logger;
    logger.info('Started running...');
    console.log(campaign.keywords)
    searcher.search(campaign, limit).then(function (reports) {
        console.log(reports);
        let init = new utils.ReportData();
        let aggReport = reports.reduce(function (aggReport, curReport) {
            aggReport.sitesVisitedNumber += curReport.sitesVisitedNumber;
            aggReport.cfSentNumber += curReport.cfSentNumber;
            aggReport.blockedByBLNumber += curReport.blockedByBLNumber;
            aggReport.noCfNumber += curReport.noCfNumber;
            aggReport.keyword += `,${curReport.keyword}`
            return aggReport;
        }, init);
        utils.other.createReport(aggReport, curTime, campaign.name);

    }).catch(function (err) {
        logger.error(JSON.stringify(err));
        console.log(reports);
        let init = new utils.ReportData();
        let aggReport = err.reduce(function (aggReport, curReport) {
            aggReport.sitesVisitedNumber += curReport.sitesVisitedNumber;
            aggReport.cfSentNumber += curReport.cfSentNumber;
            aggReport.blockedByBLNumber += curReport.blockedByBLNumber;
            aggReport.noCfNumber += curReport.noCfNumber;
            aggReport.keyword += `,${curReport.keyword}`
            return aggReport;
        }, init);
        utils.other.createReport(aggReport, curTime, campaign.name);

    });
};


module.exports = runner;