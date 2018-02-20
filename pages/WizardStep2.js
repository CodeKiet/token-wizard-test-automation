const page=require('./Page.js');
const webdriver = require('selenium-webdriver'),
      chrome = require('selenium-webdriver/chrome'),
      firefox = require('selenium-webdriver/firefox'),
      by = require('selenium-webdriver/lib/by');
const By=by.By;

//const fieldName=By.xpath("//*[@id=\"root\"]/div/section/div[2]/div[2]/div[1]/input");
//const fieldTicker=By.xpath("//*[@id=\"root\"]/div/section/div[2]/div[2]/div[2]/input");
//const fieldDecimals=By.xpath("//*[@id=\"root\"]/div/section/div[2]/div[2]/div[3]/input");
//const buttonContinue=By.xpath("//*[@id=\"root\"]/div/section/div[3]/a");
const buttonContinue=By.xpath("//*[contains(text(),'Continue')]");

class WizardStep2 extends page.Page {

    constructor(driver) {
        super(driver);
        this.URL;
        this.fieldName;
        this.fieldTicker;
        this.fieldDecimals;

    }

    async init(){

        var locator = By.className("input");
        var arr = await super.findWithWait(locator);
        this.fieldName = arr[0];
        this.fieldTicker = arr[1];
        this.fieldDecimals = arr[2];
    }



    async fillName(name){
        await this.init();
        super.fillField(this.fieldName,name);
}
async fillTicker(name){
    await this.init();
    super.fillField(this.fieldTicker,name);
}
async fillDecimals(name){
    await this.init();
    super.fillField(this.fieldDecimals,name);
}


clickDecimals(){
    super.clickWithWait(fieldDecimals);

}


clickButtonContinue(){
    super.clickWithWait(buttonContinue);
}


}
module.exports.WizardStep2=WizardStep2;