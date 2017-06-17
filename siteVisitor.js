"use strict";
const utils = require('./utils.js');
const database = require('./db/databaseHandler');
const finder = require('./contactUsFinder.js');

const visitor = {};
const shouldVisitHost = function (connection, hostname, campaign, checkForFailure) {
    return new Promise(function (resolve, reject) {

        database.createBlackListModel(connection).then(function (model) {
            database.checkExists(model, hostname).then(function (existsInGeneral) {
                database.createPrivateBlackList(connection).then(function (model) {
                    database.checkIfSiteBlockedForCampaign(model, hostname, campaign.name, checkForFailure).then(function (existsInCampaign) {
                        resolve(!existsInCampaign && !existsInGeneral)
                    }).catch(err => console.log());
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    });
};

const addHostToBlackList = function (connection, hostname, campaign) {
    return new Promise(function (resolve, reject) {
        let data = {};
        data.site = hostname;
        database.createBlackListModel(connection).then(model =>
            database.addToBlackList(model, data).then(_ => resolve()).catch(e => reject(e))
        ).catch(e => reject(e));
    });
}

const addToBlacklist = function (url, campaign, connection, didFail) {
    const hostname = utils.other.getHostName(url);
    return new Promise(function (resolve, reject) {
        database.createPrivateBlackList(connection).then(function (model) {
            database.addToPrivateBlackList(model, {
                site: hostname,
                campaign: campaign.name,
                didFail: didFail
            }).then(function () {
                resolve();
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
};

visitor.visitSite = (connection, url, campaign) => new Promise(function (resolve, reject) {
    shouldVisitHost(connection, utils.other.getHostName(url), campaign,false)
        .then(function (shouldVisit) {
            if (!shouldVisit) {
                //reportData.blockedByBLNumber += 1;
                reject("already visited")
            } else {
                finder.logger = visitor.logger;
                finder.find(url, campaign)
                    .then(function () {
                        addToBlacklist(url, campaign, connection, false);
                        //reportData.cfSentNumber += 1;
                        visitor.logger.info('url:' + url + " sent!");
                        resolve(1);
                    }).catch(function (err) {
                        //reportData.noCfNumber += 1;
                        addToBlacklist(url, campaign, connection, true);
                        const error = new Error(`url: ${url} ${JSON.stringify(err)} ${JSON.stringify(err.stack)}`);
                        visitor.logger.error(error);
                        reject("url failure")
                    });
            }
        }).catch(function (err) {
            console.log(err)
            const error = new Error('url:' + url + " " + JSON.stringify(err));
            visitor.logger.error(error);
            resolve(0)
        });
});
module.exports = visitor;