var solver = require('./2captchaSolver.js');
const driver = require('selenium-webdriver');
const {Builder, By, until} = require('selenium-webdriver');
const utils = require('./utils.js');

// DeathByCaptcha = require("deathbycaptcha");
// var dbc = new DeathByCaptcha("Jsinger@zdhconsulting.com", "67araydeathbycaptcha");

var options = {
    limit: 50,
    solver: solver
};

var searcher = {};
searcher.search = function (keywords) {
    const promises = [];
    for(let word of keywords) {
        promises.push(searchKeyword.bind(this,word));
    }
    return utils.other.promiseSerial(promises);
};

const searchKeyword = function (keyword) {
    return new Promise(function (resolve, reject) {
        const chromeCapabilities = driver.Capabilities.chrome();
        const chromeOptions = {
            'args': ['--lang', 'en-US']
        };
        chromeCapabilities.set('chromeOptions', chromeOptions);
        let browser = new Builder()
            .withCapabilities(chromeCapabilities)
            .build();
        browser.get("http://www.google.com");
        browser.findElement(By.name('q')).sendKeys(keyword, driver.Key.RETURN);
        var chain = Promise.resolve([]);
        for (let i = 0; i < (options.limit / 9); i++) {
            chain = chain.then(function (allLinks) {
              if(allLinks){
                console.log(i);
                return new Promise(function (resolve, reject) {
                    findLinks(browser).then(function (links) {
                      console.log('links are found');
                        browser.findElement(By.css("td:last-of-type.navend > a.pn"))
                            .then(function (element) {
                                element.click();
                                console.log('resolving');
                                resolve(allLinks.concat(links));
                            }).catch(function (err) {
                            if (err.name && err.name === 'NoSuchElementError' && allLinks) {
                                reject(new utils.exceptions.NoMoreResultsException(allLinks.concat(links)));
                            } else {
                                reject(err);
                            }
                        });
                    }).catch(function (err) {
                        if (err === "LastPage") {
                            reject(new utils.exceptions.NoMoreResultsException(allLinks));
                        } else {
                            reject(err);
                        }
                    })
                });
              }
            }).catch(function (err) {
              console.log('error linking ' + err);
                // TODO:change string here
                if (err.constructor.name === "NoMoreResultsException") {
                    resolve(err.results)
                } else {
                    // reject(err);
                    resolve(err.results)
                }
            });
        }
        chain.then(function (links) {
            browser.quit();
            resolve(links)
        }).catch(function (err) {
            if (typeof(err) === utils.exceptions.NoMoreResultsException) {
                browser.quit();
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
                    browser.wait(until.elementLocated(By.css("td.navend > a.pn")),10000000)
                        .then(function () {
                            browser.findElements(By.css("h3.r > a")).then(function (elems) {
                                if (elems.length === 0) {
                                    reject("LastPage");
                                } else {
                                    const linksPromises = elems.map(elem => elem.getAttribute("href"));
                                    Promise.all(linksPromises).then(links=>resolve(links)).catch(err=>reject(err));
                                }
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                        reject(err)
                    });
                } else {
                    browser.wait(until.elementLocated(By.css("td.navend > a.pn")),10000)
                        .then(function () {
                            browser.findElements(By.css("h3.r > a")).then(function (elems) {
                                if (elems.length === 0) {
                                    reject("LastPage");
                                } else {
                                    const linksPromises = elems.map(elem => elem.getAttribute("href"));
                                    Promise.all(linksPromises).then(links=>resolve(links)).catch(err=>reject(err));
                                }
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                        reject(err)
                    });

                }
            }).catch(err=>reject(err));
    });
};
module.exports = searcher;
