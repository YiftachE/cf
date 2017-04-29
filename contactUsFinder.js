const driver = require('selenium-webdriver');
const {
    Builder,
    By,
    until,
    error
} = require('selenium-webdriver');
const request = require('request')
const utils = require('./utils.js');
const captchaSolver = require("./2captchaSolver.js")
let finder = {};

finder.find = function (url, campaign) {
    return new Promise(function (resolve, reject) {
        let browser = new Builder()
            .forBrowser('chrome')
            .build();
        browser.manage().timeouts().pageLoadTimeout(30000);
        browser.manage().timeouts().setScriptTimeout(3000);
        setTimeout(function () {
            browser.quit().then(() =>
                    reject(new error.TimeoutError("browser timeout")))
                .catch(e =>
                    reject(e))
        }, 60000);
        // setTimeout()
        let self = this;
        this.didntQuit = true;
        browser.safeQuit = function () {
            let delegate = () =>
                new Promise(function (resolve, reject) {
                    return browser.getTitle().then(function () {
                        return browser.close().then(() => resolve()).catch(e => resolve())
                    }).catch(e => reject(e))
                });
            return utils.promise.tryAtMost(undefined, 10, delegate).catch(e => reject(e))
        };
        browser.get(url).then(function () {
            browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"))
                .then(function (elements) {
                    if (elements.length === 0) {
                        const pictureName = `./sc/${campaign.name}/NoContact-${utils.other.getHostName(url)}`;
                        utils.selenium.takeScreenshot(browser, pictureName)
                            .then(function () {
                                browser.safeQuit().then(function () {
                                    reject(new utils.exceptions.NoFormException());
                                });
                            }).catch(function (err) {
                                browser.safeQuit().then(function () {
                                    reject(new utils.exceptions.NoFormException(err));
                                });
                            });
                    } else {
                        let promises = [];
                        for (let i = 0; i < elements.length; i++) {
                            promises.push(goToContact.bind(this, i, elements[i], browser, url, campaign));
                        }
                        Promise.all(promises.map(utils.promise.reflect)).then(function (results) {
                            var success = results.filter(x => x.status === "resolved");
                            if (success.length === 0) {
                                browser.safeQuit().then(_ =>
                                    reject(new Error("site was not successful")));
                            } else {
                                console.log('url:' + url + " success!");
                                browser.safeQuit();
                                resolve()

                            }
                        }).catch(function (err) {
                            if (err.text === "site was not sucessfull") {
                                console.log("debug now");
                            }
                            browser.safeQuit().then(function () {
                                reject(new utils.exceptions.NoContactException(err));
                            });

                        });
                    }
                })
                .catch(function (err) {
                    reject(err);
                });
        }).catch(function (e) {
            browser.safeQuit().then(() =>
                reject(e)).catch(_ => reject(e));
        });
    })
};


const searchForm = function (browser, url, campaign) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.css("form")).then(function (elements) {
            console.log("got to search form")
            if (elements.length === 0) {
                reject(new utils.exceptions.NoFormException());
            } else {
                // Check what happens when theres multiple forms
                browser.findElements(By.css("form input,form textarea")).then(function (inputs) {
                    fillForm(browser, inputs, campaign).then(function (res) {
                            if (res.filter(f => f.status === "resolved" && f.v !== undefined).length > 0) {
                                const pictureName = `./sc/Success-${utils.other.getHostName(url)}`;
                                utils.selenium.takeScreenshot(browser, pictureName).then(function () {
                                    inputs[0].submit().then(function () {
                                        // TODO : try to avoid this setTimeout
                                        setTimeout(function () {
                                            browser.navigate().back()
                                                .then(function () {
                                                    resolve();
                                                }).catch(function (err) {
                                                    reject(err);
                                                });
                                        }, 3000);
                                    }).catch(function (err) {
                                        const pictureName = `./sc/${campaign.name}/NoForm-${utils.other.getHostName(url)}`;
                                        utils.selenium.takeScreenshot(browser, pictureName)
                                            .then(function () {
                                                browser.safeQuit().then(_ =>
                                                        reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err)))
                                                    .catch(e =>
                                                        reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err)));

                                            })
                                            .catch(function (e) {
                                                browser.safeQuit().then(function () {;
                                                    reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err));
                                                }).catch(e =>
                                                    reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err))
                                                );
                                            });
                                    });
                                }).catch(function (err) {
                                    finder.logger.error(err);
                                    console.log('url:' + url + " success!");
                                });
                            } else {
                                browser.safeQuit()
                                    .then(_ =>
                                        reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs")))
                                    .catch(e =>
                                        reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", e)));
                            }
                        })
                        .catch(function (err) {
                            browser.safeQuit().catch(e =>
                                reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err)));
                        })
                }).catch(function (e) {
                    console.log("did it crash over here?")
                    browser.safeQuit().catch(e =>
                        reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err)))
                });
            }
        }).catch(function (err) {
            console.log("did it crash here?")
            browser.safeQuit().catch(e =>
                reject(err));

        });
    });

};
const fillForm = function (browser, inputs, campaign) {
    let promises = [];
    for (let input of inputs) {
        promises.push(function () {
            return new Promise(function (resolve, reject) {
                input.getTagName().then(function (tagName) {
                    if (tagName === "textarea") {
                        input.sendKeys(campaign.message);
                        resolve("message");
                    } else {
                        input.getAttribute("type").then(function (type) {
                            if (type === "text") {
                                input.getAttribute("name").then(function (name) {
                                    const lcName = name.toLowerCase();
                                    if (lcName.includes("name")) {
                                        if (lcName.includes("firstName")) {
                                            input.sendKeys(campaign.firstName);
                                        } else
                                        if (lcName.includes("lastName")) {
                                            input.sendKeys(campaign.lastName);
                                        } else {
                                            input.sendKeys(`${campaign.firstName} ${campaign.lastName}`);
                                        }
                                        resolve(`${lcName}`);
                                    } else if (lcName.includes("email") || lcName.includes("mail")) {
                                        input.sendKeys(campaign.email)
                                        resolve(`${lcName}`);
                                    } else if (lcName.includes("company")) {
                                        input.sendKeys(campaign.company);
                                        resolve(`${lcName}`);
                                    } else if (lcName.includes("phone")) {
                                        input.sendKeys(campaign.phoneNumber);
                                        resolve(`${lcName}`);
                                    } else {
                                        if (lcName.includes("captcha")) {
                                            browser.findElement(By.xpath("//img[contains(@id ,captcha) or contains(@id ,Captcha)]"))
                                                .then(function (element) {
                                                    element.getAttribute("src").then(function (url) {
                                                        if (!url) {
                                                            reject(new utils.exceptions.SubmitExcpetion("could not solve captcha"))
                                                        } else {
                                                            request.get({
                                                                url: url,
                                                                encoding: null
                                                            }, (err, res, body) => {
                                                                if (!err) {
                                                                    captchaSolver.solve(body).then(function (solution) {
                                                                        input.sendKeys(solution);
                                                                        console.log(solution);
                                                                        resolve(`${lcName}`);
                                                                    }).catch(e =>
                                                                        reject(utils.exceptions.SubmitExcpetion("could not solve captcha")));
                                                                } else {
                                                                    reject(utils.exceptions.SubmitExcpetion("could not solve captcha"));
                                                                }
                                                            });
                                                        }
                                                    }).catch(e => reject(new utils.exceptions.SubmitExcpetion("could not solve captcha")));
                                                }).catch(e =>
                                                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err))
                                                )
                                        } else
                                            reject(new Error("no input was of the contact type"))
                                    }
                                }).catch(function (err) {
                                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                                });
                            } else if (type === "checkbox") {
                                input.click();
                                resolve();
                            } else
                                resolve();
                        }).catch(function (err) {
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                        });
                    }
                }).catch(function (err) {
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                })
            })
        });
    }
    return Promise.all(promises.map(utils.promise.reflect));
};
const goToContact = function (index, element, browser, url, campaign) {
    return new Promise(function (resolve, reject) {
        var click = () => browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"), 200)
            .then(elements => elements[index].click())
        utils.promise.tryAtMost(undefined, 10, click)
            .then(function () {;
                return searchForm(browser, url, campaign)
                    .then(_ => resolve())
                    .catch(err => {
                        const pictureName = `./sc/${campaign.name}/NoForm-${utils.other.getHostName(url)}`;
                        utils.selenium.takeScreenshot(browser, pictureName)
                            .then(_ =>
                                reject(err))
                            .catch(function (e) {
                                browser.safeQuit().then(function () {;
                                    reject(e);
                                }).catch(e =>
                                    reject(e));
                            });
                    }).catch(e =>
                        reject(e));
            }).catch(function (e) {
                browser.safeQuit().then(() =>
                    reject(e));
            });
    });
};

module.exports = finder;