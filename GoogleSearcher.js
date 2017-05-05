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
    for (let word of campaign.keywords) {
        promises.push(searchKeyword.bind(this, word, limit, campaign, new utils.ReportData(word)));
    }
    return utils.other.promiseSerial(promises).then(p =>
        p.map(function (entity) {
            let res = undefined;
            if (p.status === "rejected") {
                res = entity.e.results;
            } else {
                res = entity.v;
            }
            return res;
        }));
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
        browser.manage()
            .timeouts()
            .pageLoadTimeout(300000000);
        browser.get("http://www.google.com");
        var a = browser.findElement(By.name('q')).sendKeys(keyword).then(function () {
            browser.findElement(By.name('q')).sendKeys(driver.Key.ENTER);
        });
        let connection = database.create();
        var chain = Promise.resolve(report);
        for (let i = 0; i < (limit / 10); i++) {
            chain = chain.then(report => {
                return new Promise(function (resolve, reject) {
                    findLinks(browser).then(function (links) {
                        utils.other.promiseSerial(
                                links.map(link => () => visitor.visitSite(connection, link, campaign)))
                            .then(function (results) {
                                var success = results.filter(x => x.status === "resolved");
                                var blockedByBLNumber = results.filter(x => x.status === "rejected").filter(x => x.e === "already visited");
                                report.sitesVisitedNumber += results.length;
                                report.cfSentNumber += success.length;
                                report.blockedByBLNumber += blockedByBLNumber.length;
                                report.noCfNumber += results.length - success.length - blockedByBLNumber.length;

                                var promise = function () {
                                    return browser.getCurrentUrl()
                                        .then(function (url) {
                                            return browser.get(url)
                                                .then(() =>
                                                    browser.wait(until.elementLocated(By.css("td:last-of-type.navend > a.pn")), 4000)
                                                    .then(() =>
                                                        browser.findElement(By.css("td:last-of-type.navend > a.pn"))
                                                    ))
                                        })
                                };
                                return promise().then(function (element) {
                                    element.click().then(_ =>
                                            setTimeout(function () {
                                                resolve(report)
                                            }, 5000))
                                        .catch(e =>
                                            reject(e));
                                }).catch(function (err) {
                                    reject(new utils.exceptions.NoMoreResultsException(report));
                                });
                            }).catch(function (err) {
                                if (err.name && err.name === 'NoSuchElementError' && report) {
                                    reject(new utils.exceptions.NoMoreResultsException(report));
                                } else {
                                    console.log(err.stack)
                                    err.results = report
                                    reject(err);
                                }
                            });
                    }).catch(function (err) {
                        if (err === "LastPage") {
                            reject(new utils.exceptions.NoMoreResultsException(report));
                        } else {
                            err.results = report;
                            reject(err);
                        }
                    })
                });
            }).catch(function (err) {
                console.log('found an error');
                console.log(err);
                reject(report);
            });
        }
        chain.then(function (report) {
            browser.quit().then(function () {;
                self.closedState = true;
                resolve(report)
            }).catch(e => resolve(report));
        }).catch(function (e) {
            browser.quit().then(function () {;
                self.closedState = true;
                resolve(report)
            }).catch(e => resolve(report))
        });
    }).catch(function (err) {
        if (typeof (err) === utils.exceptions.NoMoreResultsException) {
            browser.quit().then(function () {;
                self.closedState = true;
                resolve(report)
            }).catch(e => resolve(report));

        } else {
            reject(err);
        }
    });
}

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