const logger = require('../entity/Logger.js').logger;
const page =require('./Page.js').Page;
const By = require('selenium-webdriver/lib/by').By;

const buttonNewCrowdsale=By.className("button button_fill");
const buttonChooseContract=By.className("button button_outline");

class WizardWelcome extends page.Page{

    constructor(driver,URL){
        super(driver);
        this.URL = URL;
        this.name = "WizardWelcome page: ";
    }

    async clickButtonNewCrowdsale(){
        logger.info(this.name + "button NewCrowdsale");
        return await super.clickWithWait(buttonNewCrowdsale);
    }

    async clickButtonChooseContract(){
        logger.info(this.name + "button ChooseContract");
        return await  super.clickWithWait(buttonChooseContract);
    }

    async open() {
	    logger.info(this.name + ": open");
	    await super.open(this.URL);
	    return await super.getUrl();
    }

    async isPresentButtonNewCrowdsale() {
	    logger.info(this.name + ": isPresentButtonNewCrowdsale");
	    return await super.isElementDisplayed(buttonNewCrowdsale);
    }

	async isPresentButtonChooseContract() {
		logger.info(this.name + ": isPresentButtonChooseContract");
		return await super.isElementDisplayed(buttonChooseContract);
	}

	async isPage(){
        return await super.isElementDisplayed(buttonNewCrowdsale) &&
	           await super.isElementDisplayed(buttonChooseContract);
    }
}
module.exports.WizardWelcome=WizardWelcome;
