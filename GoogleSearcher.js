const solver = require('./2captchaSolver.js');
const driver = require('selenium-webdriver');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver');
const utils = require('./utils.js');
const database = require('./db/databaseHandler');
const visitor = require('./siteVisitor.js')

// DeathByCaptcha = require("deathbycaptcha");
// var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

const searcher = {};
var self = this;
self.closedState = false;
searcher.search = function (campaign, limit) {
    console.log('inside google searcher');
    const promises = [];
    const reportData = {};
    reportData.cfSentNumber = 0;
    reportData.noCfNumber = 0;
    reportData.blockedByBLNumber = 0;

    for (let word of campaign.keywords) {
        promises.push(searchKeyword.bind(this, word, limit, campaign, reportData));
    }
    return utils.other.promiseSerial(promises);
};

const searchKeyword = function (keyword, limit, campaign, report) {
    console.log('searching keyword ' + keyword);
    return new Promise(function (resolve, reject) {
        visitor.logger = searcher.logger;
        const chromeCapabilities = driver.Capabilities.chrome();
        const chromeOptions = {
            'args': ['--lang', 'en-US']
        };
        chromeCapabilities.set('chromeOptions', chromeOptions);
        let browser = new Builder()
            .withCapabilities(chromeCapabilities)
            .build();
        browser.get("http://www.google.com");
        var a = browser.findElement(By.name('q')).sendKeys(keyword).then(function () {
            browser.findElement(By.name('q')).sendKeys(driver.Key.ENTER);
        });
        let connection = database.create();
        var chain = Promise.resolve(report);
        for (let i = 0; i < (limit / 12); i++) {
            chain = chain.then(report => {
                return new Promise(function (resolve, reject) {
                    findLinks(browser).then(function (links) {
                        var retryCount = {
                            "count": 20
                        };
                        utils.other.promiseSerial(links.map(link => () => visitor.visitSite(connection, link, campaign)))
                            .then(function (results) {
                                var success = results.filter(x => x.status === "resolved");
                                var blockedByBLNumber = results.filter(x => x.status === "rejected").filter(x => x.e === "already visited");
                                report.sitesVisitedNumber += results.length;
                                report.cfSentNumber += success.length;
                                report.blockedByBLNumber += blockedByBLNumber.length;
                                report.noCfNumber += results.length - success.length - blockedByBLNumber.length;

                                var retry = () => browser.findElement(By.css("td:last-of-type.navend > a.pn"));
                                retry().then(function (element) {
                                    element.click();
                                    resolve(report);
                                }).catch(function (err) {
                                    if (retryCount.count > 0) {
                                        retryCount.count--;
                                        retry();
                                    } else {
                                        console.log(err);
                                    }
                                });
                            }).catch(function (err) {
                                if (err.name && err.name === 'NoSuchElementError' && report) {
                                    reject(new utils.exceptions.NoMoreResultsException(report));
                                } else {
                                    console.log(err.stack)
                                    reject(err);
                                }
                            });
                    }).catch(function (err) {
                        if (err === "LastPage") {
                            reject(new utils.exceptions.NoMoreResultsException(report));
                        } else {
                            reject(err);
                        }
                    })
                });
            }).catch(function (err) {
                console.log('found an error');
                console.log(err);
                if (err.constructor.name === "NoMoreResultsException") {
                    resolve(err.results)
                } else {
                    // reject(err);
                    resolve(err);
                }
            });
        }
        chain.then(function (report) {
            browser.quit();
            self.closedState = true;
            resolve(report)
        }).catch(function (err) {
            if (typeof (err) === utils.exceptions.NoMoreResultsException) {
                browser.quit();
                self.closedState = true;
                resolve(err.results)
            } else {
                reject(err);
            }
        });
    });
};

const findLinks = function (browser) {
    return new Promise(function (resolve, reject) {
        browser.getCurrentUrl()
            .then(function (url) {
                if (url.includes("sorry")) {
                    browser.wait(until.elementLocated(By.css("td.navend > a.pn")), 100000000)
                        .then(function () {
                            browser.findElements(By.css("h3.r > a")).then(function (elems) {
                                if (elems.length === 0) {
                                    reject("LastPage");
                                } else {
                                    const linksPromises = elems.map(elem => new {
                                        link: elem.getAttribute("href"),
                                        keyword: "word"
                                    });
                                    Promise.all(linksPromises).then(links => resolve(links)).catch(err => reject(err));
                                }
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                            reject(err)
                        });
                } else {
                    browser.wait(until.elementLocated(By.css("td.navend > a.pn")), 30000000)
                        .then(function () {
                            browser.findElements(By.css("h3.r > a")).then(function (elems) {
                                if (elems.length === 0) {
                                    reject("LastPage");
                                } else {
                                    const linksPromises = elems.map(elem =>
                                        elem.getAttribute("href")
                                    );
                                    Promise.all(linksPromises).then(links => resolve(links)).catch(err => {
                                        if (err.name !== "StaleElementReferenceError") {
                                            reject(err)
                                        } else {
                                            console.log("huh?")
                                            resolve([]);
                                        }
                                    });
                                }
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                            reject(err)
                        });

                }
            }).catch(err => reject(err));
    });
};
module.exports = searcher;