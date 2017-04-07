const driver = require('selenium-webdriver');
const {Builder, By, until} = require('selenium-webdriver');
const utils = require('./utils.js');

let finder = {};

finder.find = function (url, campaign) {
    return new Promise(function (resolve, reject) {
        let browser = new Builder()
            .forBrowser('chrome')
            .build();
        browser.get(url);
        browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"))
            .then(function (elements) {
                if (elements.length === 0) {
                    const pictureName = `./sc/${campaign.name}/NoContact-${utils.other.getHostName(url)}`;
                    utils.selenium.takeScreenshot(browser, pictureName)
                        .then(function () {
                            browser.quit();
                            console.log('check17');
                            reject(new utils.exceptions.NoContactException());
                        }).catch(function (err) {
                        browser.quit();
                        console.log('check16');
                        reject(new utils.exceptions.NoContactException(err));
                    });
                } else {
                    let promises = [];
                    for (let i = 0; i < elements.length; i++) {
                        promises.push(goToContact.bind(this, i, browser, url, campaign));
                    }
                    utils.other.promiseSerial(promises)
                        .then(function (results) {
                            if (results.some(result => result !== undefined)) {
                                const pictureName = `./sc/Success-${utils.other.getHostName(url)}`;
                                utils.selenium.takeScreenshot(browser, pictureName)
                                    .then(function () {
                                        browser.quit();
                                        console.log('url:' + url + " success!");
                                        resolve()
                                    }).catch(function (err) {
                                    console.log('check15');
                                    finder.logger.error(err);
                                    browser.quit();
                                    console.log('url:' + url + " success!");
                                    resolve()
                                });
                            } else {
                                console.log('check14');
                                reject(results)
                            }

                        }).catch(function (err) {
                        console.log('check13');
                        browser.quit();
                        reject(err);
                    });
                }

            }).catch(function (err) {
            console.log('check12');
            browser.quit();
            reject(err);
        });
    })
};

const searchForm = function (browser, campaign) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.css("form[action*='contact' i]")).then(function (elements) {
            if (elements.length === 0) {
                console.log('check11');
                reject(new utils.exceptions.NoFormException());
            } else {
                // Check what happens when theres multiple forms
                browser.findElements(By.css("form[action*='contact' i] input,form[action*='contact' i] textarea,form[action*='contact' i] select"))
                    .then(function (inputs) {
                    fillForm(inputs, campaign).then(function () {
                        // TODO: figure out a way to know if the form was really submitted or an error occoured
                        inputs[0].submit().then(function () {
                            // TODO : try to avoid this setTimeout
                            setTimeout(function () {
                                browser.navigate().back()
                                    .then(function () {
                                        resolve();
                                    }).catch(function (err) {
                                    console.log('check10');
                                    reject(err);
                                });
                            }, 3000);
                        }).catch(function (err) {
                            console.log('check9');
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't send form", err));
                        });
                        //TODO:change this to fancy
                    }).catch(err=>reject(err))
                }).catch(function (err) {
                    console.log('check8');
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't find any inputs", err));
                })
            }
        }).catch(function (err) {
            console.log('check7');
            reject(err)
        });
    });
};
const fillForm = function (inputs, campaign) {
    let promises = [];
    for (let input of inputs) {
        promises.push(function(){
            return new Promise(function (resolve, reject) {
                input.getTagName().then(function (tagName) {
                    if (tagName === "textarea") {
                        input.sendKeys('hello its me!');
                        // input.sendKeys(campaign.message);
                    } else if (tagName === "select") {
                        input.getAttribute("name").then(function (name) {
                            const lcName = name.toLowerCase();
                            if(lcName.includes("country")) {
                                input.click();
                                input.sendKeys(driver.Key.ARROW_DOWN,driver.Key.ARROW_DOWN,driver.Key.RETURN);
                            } else {
                                input.click();
                                input.sendKeys(driver.Key.ARROW_DOWN,driver.Key.ARROW_DOWN,driver.Key.RETURN);
                            }
                            resolve();
                        }).catch(function (err) {
                            console.log('check6');
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                        })
                    } else if(tagName === "input") {
                        input.getAttribute("type").then(function (type) {
                            if (type === "text") {
                                input.getAttribute("name").then(function (name) {
                                    const lcName = name.toLowerCase();
                                    if (lcName.includes("name")) {
                                        input.sendKeys(campaign.firstName);
                                    } else if (lcName.includes("email")) {
                                        input.sendKeys(campaign.email);
                                    } else if(lcName.includes("phone")) {
                                        // input.sendKeys(campaign.phone);
                                        input.sendKeys("0543876932");
                                    } else {
                                        console.log('input didn\'t match anything:' + name);
                                    }
                                    resolve();
                                }).catch(function (err) {
                                    console.log('check5');
                                    // if (err.name === "ElementNotVisibleError") {
                                        // finder.logger.error(err);
                                        // resolve();
                                    // } else {
                                        reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                                    // }
                                });
                            } else if (type === "checkbox") {
                                input.click();
                                resolve();
                            } else if (type === "email") {
                                input.sendKeys(campaign.email);
                                resolve();
                            } else {
                                resolve();
                            }
                        }).catch(function (err) {
                            console.log(`check4:${err}`);
                            reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                        });
                    } else {
                        console.log('input didn\'t match tag:' + tagName);
                        resolve();
                    }
                }).catch(function (err) {
                    console.log('check3');
                    reject(new utils.exceptions.SubmitExcpetion("Couldn't parse form", err));
                })
            })
        });
    }
    return utils.other.promiseSerial(promises);
};
const goToContact = function (index, browser, url, campaign) {
    return new Promise(function (resolve, reject) {
        browser.findElements(By.xpath("//a[contains(translate(text(),'CONTACT','contact'), 'contact')]"))
            .then(function (elements) {
                elements[index].click();
                setTimeout(function () {
                    searchForm(browser, campaign).then(_ => resolve(true)).catch(err => {
                        const pictureName = `./sc/${campaign.name}/NoForm-${utils.other.getHostName(url)}`;
                        utils.selenium.takeScreenshot(browser, pictureName).then(_ => reject(err)).catch(_ => reject(err));
                        console.log('check2');
                        // reject(err);
                    });
                }, 3000);
            }).catch(function (err) {
                console.log('check1');
            // reject(err);
            resolve(err)
        });
    });
};

module.exports = finder;
