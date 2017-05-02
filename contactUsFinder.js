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
        finder.didntFill = true;
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
                                }).catch(e =>
                                    reject(new utils.exceptions.NoFormException()));
                            }).catch(function (err) {
                                browser.safeQuit().then(function () {
                                    reject(new utils.exceptions.NoFormException(err));
                                }).catch(e =>
                                    reject(new utils.exceptions.NoFormException()));
                            });
                    } else {
                        let promises = [];
                        for (let i = 0; i < elements.length; i++) {
                            promises.push(goToContact.bind(this, i, elements[i], browser, url, campaign));
                        }
                        utils.other.promiseSerial(promises).then(function (results) {
                            var success = results.filter(x => x.status === "resolved");
                            if (success.length === 0) {
                                browser.safeQuit().then(_ =>
                                    reject(new Error("site was not successful")));
                            } else {
                                console.log('url:' + url + " success!");
                                browser.safeQuit().then(_ =>
                                        resolve())
                                    .catch(e =>
                                        reject(e));

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
                browser.findElements(By.css("form[action*=Contact] input,form[action*=Contact] textarea")).then(function (inputs) {
                    fillForm(browser, inputs, campaign).then(function (res) {
                            if (res.filter(f => f.status === "resolved" && f.v !== undefined).length > 0) {
                                const pictureName = `./sc/Success-${utils.other.getHostName(url)}`;
                                utils.selenium.takeScreenshot(browser, pictureName).then(function () {
                                    inputs[0].getAttribute("name").then(name =>
                                        console.log(name))
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
                                                reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err));

                                            })
                                            .catch(function (e) {
                                                reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err));
                                            });
                                    });
                                }).catch(function (err) {
                                    finder.logger.error(err);
                                    resolve();
                                    console.log('url:' + url + " success!");
                                });
                            } else {
                                reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs"));
                            }
                        })
                        .catch(function (err) {
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err));
                        })
                }).catch(function (e) {
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err));
                });
            }
        }).catch(function (err) {
            reject(err);

        });
    });

};
const fillForm = function (browser, inputs, campaign) {
    let promises = [];
    for (let input of inputs) {
        promises.push(function () {
            return new Promise(function (resolve, reject) {
                if (finder.didntFill) {

                    input.getTagName().then(function (tagName) {
                        if (tagName === "textarea") {
                            input.sendKeys(campaign.message);
                            resolve("message");
                        } else {
                            input.getAttribute("type").then(function (type) {

                                if (type === "text" || type === "email") {
                                    new Promise(function (fulfil, decline) {
                                            input.getAttribute("name").then(function (name) {
                                                input.getAttribute("id").then(function (id) {
                                                    let lcName = name.toLowerCase().replace("_", "").replace("-", "");
                                                    let lcID = id.toLowerCase().replace("_", "").replace("-", "");
                                                    fulfil([lcName, lcID])
                                                })
                                            })
                                        }).then(function (result) {
                                            let [lcName, lcID] = result;
                                            if (lcName.includes("company") || lcID.includes("company") || lcName.includes("firm") || lcID.includes("firm")) {
                                                input.sendKeys(campaign.company)
                                                    .then(_ =>
                                                        resolve(`${lcName}`))
                                                    .catch(e =>
                                                        reject(e))
                                            } else if (lcName.includes("job") || lcID.includes("job")) {
                                                input.sendKeys(campaign.job)
                                                    .then(_ =>
                                                        resolve(`${lcName}`))
                                                    .catch(e =>
                                                        reject(e))
                                            } else if (lcName.includes("email") || lcName.includes("mail") || lcID.includes("email") || lcID.includes("mail") || type == "email") {
                                                input.sendKeys(campaign.email)
                                                    .then(_ =>
                                                        resolve(`${lcName}`))
                                                    .catch(e =>
                                                        reject(e))
                                            } else if (lcName.includes("name") || lcID.includes("name")) {
                                                if (lcName.includes("firstname") || lcID.includes("firstname") || lcName.includes("yourname") || lcID.includes("yourname")) {
                                                    input.sendKeys(campaign.firstName)
                                                        .then(
                                                            resolve(`${lcName}`))
                                                        .catch(e =>
                                                            reject(e));
                                                } else
                                                if (lcName.includes("lastname") || lcID.includes("lastname")) {
                                                    input.sendKeys(campaign.lastName)
                                                        .then(
                                                            resolve(`${lcName}`))
                                                        .catch(e =>
                                                            reject(e));
                                                } else {
                                                    input.sendKeys(`${campaign.firstName} ${campaign.lastName}`)
                                                        .then(
                                                            resolve(`${lcName}`))
                                                        .catch(e =>
                                                            reject(e));
                                                }
                                            } else if (lcName.includes("phone") || lcID.includes("phone")) {
                                                input.sendKeys(campaign.phoneNumber)
                                                    .then(_ =>
                                                        resolve(`${lcName}`))
                                                    .catch(e =>
                                                        reject(e))
                                            } else
                                            if (lcName.includes("country") || lcID.includes("country")) {
                                                input.sendKeys(campaign.country)
                                                    .then(_ =>
                                                        resolve(`${lcName}`))
                                                    .catch(e =>
                                                        reject(e))
                                            } else {
                                                if (lcName.includes("captcha") || lcID.includes("captcha")) {
                                                    findCaptchaElement(browser)
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
                                                                                input.sendKeys(solution).then(_ =>
                                                                                        resolve(`${lcName}`))
                                                                                    .catch(e =>
                                                                                        reject(e));
                                                                            }).catch(e =>
                                                                                reject(utils.exceptions.SubmitExcpetion("could not solve captcha", e)));
                                                                        } else {
                                                                            reject(utils.exceptions.SubmitExcpetion("could not solve captcha"));
                                                                        }
                                                                    });
                                                                }
                                                            }).catch(e =>
                                                                reject(new utils.exceptions.SubmitExcpetion("could not solve captcha"))
                                                            );
                                                        }).catch(e =>
                                                            reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", e))
                                                        )
                                                } else
                                                    reject(new Error("no input was of the contact type"))
                                            }
                                        })
                                        .catch(function (err) {
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
                } else {
                    reject(new Error("already filled form"));
                }
            })


        });
    }
    return Promise.all(promises.map(utils.promise.reflect)).then(function (results) {
        if (results.filter(f => f.status === "resolved" && f.v !== undefined).length > 0) {
            finder.didntFill = false;
        }
        return results
    });
};
const findCaptchaElement = function (browser) {
    return new Promise(function (resolve, reject) {
        browser.findElement(By.xpath("//img[contains(@id ,'captcha') or contains(@id ,'Captcha')]")).then(elements => resolve(elements))
            .catch(_ => browser.findElement(By.css(".captcha img"))
                .then(element =>
                    resolve(element))
                .catch(e =>
                    reject(e)));
    });
}
const goToContact = function (index, element, browser, url, campaign) {
    return new Promise(function (resolve, reject) {
        var click = () => browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"), 200)
            .then(elements => elements[index].click())
        utils.promise.tryAtMost(undefined, 10, click)
            .then(function () {
                return searchForm(browser, url, campaign)
                    .then(_ => resolve())
                    .catch(err => {
                        const pictureName = `./sc/${campaign.name}/NoForm-${utils.other.getHostName(url)}`;
                        utils.selenium.takeScreenshot(browser, pictureName)
                            .then(_ =>
                                reject(err))
                            .catch(function (e) {
                                reject(e);
                            });
                    }).catch(e =>
                        reject(e));
            }).catch(function (e) {
                reject(e);
            });
    })
};
module.exports = finder;