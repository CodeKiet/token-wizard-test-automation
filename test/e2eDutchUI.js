let test = require('selenium-webdriver/testing');
let assert = require('assert');
const fs = require('fs-extra');
///////////////////////////////////////////////////////
const WizardWelcome = require('../pages/WizardWelcome.js').WizardWelcome;
const WizardStep1 = require('../pages/WizardStep1.js').WizardStep1;
const WizardStep2 = require('../pages/WizardStep2.js').WizardStep2;
const WizardStep3 = require('../pages/WizardStep3.js').WizardStep3;
const WizardStep4 = require('../pages/WizardStep4.js').WizardStep4;
const TierPage = require('../pages/TierPage.js').TierPage;
const ReservedTokensPage = require('../pages/ReservedTokensPage.js').ReservedTokensPage;
const CrowdsalePage = require('../pages/CrowdsalePage.js').CrowdsalePage;
const InvestPage = require('../pages/ContributionPage.js').InvestPage;
const ManagePage = require('../pages/ManagePage.js').ManagePage;
const logger = require('../entity/Logger.js').logger;
const tempOutputPath = require('../entity/Logger.js').tempOutputPath;
const Utils = require('../utils/Utils.js').Utils;
const MetaMask = require('../pages/MetaMask.js').MetaMask;
const User = require("../entity/User.js").User;
const smallAmount = 0.1;

test.describe(`e2e test for TokenWizard2.0/DutchAuctionCrowdsale. v ${testVersion} `, async function () {

    this.timeout(2400000);//40 min
    this.slow(1800000);

    const user8545_dDdCFile = './users/user8545_dDdC.json';//Owner
    const user8545_Db0EFile = './users/user8545_Db0E.json';//Investor1 - whitelisted before deployment
    const user8545_F16AFile = './users/user8545_F16A.json';//Investor2 - whitelisted before deployment
    const scenarioE2eMinCap = './scenarios/scenarioE2eDutchMincapLong.json';
    const scenarioE2eWhitelist = './scenarios/scenarioE2eDutchWhitelistShort.json';
    const scenarioForUItests = './scenarios/scenarioUItests.json';
    const scenarioE2eDutchCheckBurn = './scenarios/scenarioE2eDutchCheckBurn.json';
    let driver;
    let Owner;
    let Investor1;
    let Investor2;

    let wallet;
    let welcomePage;
    let wizardStep1;
    let wizardStep2;
    let wizardStep3;
    let wizardStep4;
    let tierPage;
    let mngPage;
    let reservedTokensPage;
    let investPage;
    let startURL;
    let crowdsaleForUItests;
    let e2eMinCap;
    let e2eWhitelist;
    let e2eCheckBurn;
    let balanceEthOwnerBefore;
    let balanceEthOwnerAfter;

/////////////////////////////////////////////////////////////////////////

    test.before(async function () {

        await Utils.copyEnvFromWizard();
        e2eMinCap = await Utils.getDutchCrowdsaleInstance(scenarioE2eMinCap);

        e2eWhitelist = await Utils.getDutchCrowdsaleInstance(scenarioE2eWhitelist);
        crowdsaleForUItests = await Utils.getDutchCrowdsaleInstance(scenarioForUItests);
        crowdsaleForUItests.totalSupply = 1e10
        e2eCheckBurn = await Utils.getDutchCrowdsaleInstance(scenarioE2eDutchCheckBurn);

        startURL = await Utils.getStartURL();
        driver = await Utils.startBrowserWithWallet();

        Owner = new User(driver, user8545_dDdCFile);
        Owner.tokenBalance = 0;
        Investor1 = new User(driver, user8545_Db0EFile);
        Investor1.tokenBalance = 0;
        Investor2 = new User(driver, user8545_F16AFile);
        Investor2.minCap = e2eWhitelist.tiers[0].whitelist[0].min;
        Investor2.maxCap = e2eWhitelist.tiers[0].whitelist[0].max;
        Investor2.tokenBalance = 0;

        await Utils.receiveEth(Owner, 20);
        await Utils.receiveEth(Investor1, 20);
        await Utils.receiveEth(Investor2, 20);
        logger.info("Roles:");
        logger.info("Owner = " + Owner.account);
        logger.info("Owner's balance = :" + await Utils.getBalance(Owner) / 1e18);
        logger.info("Investor1  = " + Investor1.account);
        logger.info("Investor1 balance = :" + await Utils.getBalance(Investor1) / 1e18);
        logger.info("Investor2  = " + Investor2.account);
        logger.info("Investor2 balance = :" + await Utils.getBalance(Investor2) / 1e18);

        wallet = await Utils.getWalletInstance(driver);
        await wallet.activate();//return activated Wallet and empty page
        await Owner.setWalletAccount();

        welcomePage = new WizardWelcome(driver, startURL);
        wizardStep1 = new WizardStep1(driver);
        wizardStep2 = new WizardStep2(driver);
        wizardStep3 = new WizardStep3(driver);
        wizardStep4 = new WizardStep4(driver);
        investPage = new InvestPage(driver);
        reservedTokensPage = new ReservedTokensPage(driver);
        mngPage = new ManagePage(driver);
        tierPage = new TierPage(driver, crowdsaleForUItests.tiers[0]);

    });

    test.after(async function () {
        // Utils.killProcess(ganache);
        //await Utils.sendEmail(tempOutputFile);
        let outputPath = Utils.getOutputPath();
        outputPath = outputPath + "/result" + Utils.getDate();
        await fs.ensureDirSync(outputPath);
        await fs.copySync(tempOutputPath, outputPath);
        //await fs.remove(tempOutputPath);
        //await driver.quit();
    });

    //////// UI TESTS ////////////////////////////////////////////////

    test.it('User is able to open wizard welcome page',
        async function () {
            await welcomePage.open();
            let result = await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
            return await assert.equal(result, true, "Test FAILED. Wizard's page is not available ");
        });

    test.it('Welcome page: button NewCrowdsale present ',
        async function () {
            let result = await welcomePage.isDisplayedButtonNewCrowdsale();
            return await assert.equal(result, true, "Test FAILED. Button NewCrowdsale not present ");
        });

    test.it('Welcome page: button ChooseContract present ',
        async function () {
            let result = await welcomePage.isDisplayedButtonChooseContract();
            return await assert.equal(result, true, "Test FAILED. button ChooseContract not present ");
        });

    test.it('Welcome page: user is able to open Step1 by clicking button NewCrowdsale ',
        async function () {
            let result = await welcomePage.clickButtonNewCrowdsale()
                && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap();
            return await assert.equal(result, true, "Test FAILED. User is not able to activate Step1 by clicking button NewCrowdsale");
        });

    test.it('Wizard step#1: user is able to click DutchAuction checkbox ',
        async function () {
            let result = await wizardStep1.waitUntilDisplayedCheckboxDutchAuction()
                && await wizardStep1.clickCheckboxDutchAuction();
            return await assert.equal(result, true, "Test FAILED. User is not able to to click DutchAuction checkbox");
        });

    test.it('Wizard step#1: user is able to open Step2 by clicking button Continue ',
        async function () {
            let count = 10;
            do {
                await driver.sleep(1000);
                if ( (await wizardStep1.isDisplayedButtonContinue()) &&
                    !(await wizardStep2.isDisplayedFieldName()) ) {
                    await wizardStep1.clickButtonContinue();
                }
                else break;
            }
            while ( count-- > 0 );
            let result = await wizardStep2.isDisplayedFieldName();
            return await assert.equal(result, true, "Test FAILED. User is not able to open Step2 by clicking button Continue");

        });
    test.it('Wizard step#2:Check persistant if account has changed ',
        async function () {
            let investor = Investor1;
            let owner = Owner;
            assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
            assert.equal(await wizardStep2.isDisplayedFieldSupply(), true, "Field 'Supply' is not displayed");
            assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
            return assert.equal(await wizardStep2.isDisplayedFieldSupply(), true, "Persistant failed if account has changed");
        });
    test.it.skip('Wizard step#2:Check persistant if page refreshed ',
        async function () {
            await wizardStep2.refresh();
            await driver.sleep(2000);
            assert.equal(await wizardStep2.isDisplayedFieldSupply(), true, "Field 'Supply' is not displayed");
            return assert.equal(false, true, "Persistant failed if page refreshed");
        });

    test.it('Wizard step#2: user able to fill out Name field with valid data',
        async function () {
            await wizardStep2.fillName("name");
            let result = await wizardStep2.isDisplayedWarningName();
            return await assert.equal(result, false, "Test FAILED. Wizard step#2: user able to fill Name field with valid data ");
        });

    test.it('Wizard step#2: user able to fill out field Ticker with valid data',
        async function () {
            await wizardStep2.fillTicker("test");
            let result = await wizardStep2.isDisplayedWarningTicker();
            return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not  able to fill out field Ticker with valid data ");
        });

    test.it('Wizard step#2: user able to fill out  Decimals field with valid data',
        async function () {
            await wizardStep2.fillDecimals("18");
            let result = await wizardStep2.isDisplayedWarningDecimals();
            return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not able to fill Decimals  field with valid data ");
        });

    test.it('Wizard step#2: user able to fill out  Total supply field with valid data',
        async function () {
            await wizardStep2.fillSupply(crowdsaleForUItests.totalSupply);
            let result = await wizardStep2.isDisplayedWarningSupply();
            return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not able to fill Total supply  field with valid data ");
        });

    test.it('Wizard step#2: button Continue is displayed and enabled',
        async function () {
            let result = await wizardStep2.isDisplayedButtonContinue();
            return await assert.equal(result, true, "Test FAILED. Wizard step#2: button Continue disabled or not displayed  ");
        });

    test.it('Wizard step#2: user is able to open Step3 by clicking button Continue ',
        async function () {
            await wizardStep2.clickButtonContinue();
            await wizardStep3.waitUntilDisplayedTitle(180);
            let result = await wizardStep3.getPageTitleText();
            result = (result === wizardStep3.title);
            return await assert.equal(result, true, "Test FAILED. User is not able to open Step3 by clicking button Continue");
        });

    test.it('Wizard step#3: field Wallet address contains current metamask account address  ',
        async function () {

            let result = await wizardStep3.getValueFromFieldWalletAddress();
            result = (result === Owner.account.toString());
            return await assert.equal(result, true, "Test FAILED. Wallet address does not match the metamask account address ");
        });

    test.it('Tier#1: Whitelist container present if checkbox "Whitelist enabled" is selected',
        async function () {
            let result = await tierPage.setWhitelisting()
                && await tierPage.isDisplayedWhitelistContainer();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to set checkbox  'Whitelist enabled'");
        });

    test.it('Wizard step#3: field minCap disabled if whitelist enabled ',
        async function () {
            let tierNumber = 1;
            let result = await tierPage.isDisabledFieldMinCap(tierNumber);
            return await assert.equal(result, true, "Test FAILED. Field minCap enabled if whitelist enabled");
        });
    test.it('Wizard step#3:Tier#1: User is able to fill out field "Supply" with valid data',
        async function () {
            tierPage.tier.supply = 69;
            let result = await tierPage.fillSupply();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
        });
    test.it('Wizard step#3: User is able to download CSV file with whitelisted addresses',
        async function () {
            let fileName = "./public/whitelistAddressesTestValidation.csv";
            let result = await tierPage.uploadWhitelistCSVFile(fileName)
                && await wizardStep3.clickButtonOk();
            return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
        });

    test.it('Wizard step#3: field Supply disabled if whitelist added ',
        async function () {
            let result = await tierPage.isDisabledFieldSupply();
            return await assert.equal(result, true, "Test FAILED. Field minCap disabled if whitelist enabled");
        });

    test.it('Wizard step#3: Number of added whitelisted addresses is correct, data is valid',
        async function () {
            let shouldBe = 5;
            let inReality = await tierPage.amountAddedWhitelist();
            return await assert.equal(shouldBe, inReality, "Test FAILED. Wizard step#3: Number of added whitelisted addresses is NOT correct");

        });

    test.it('Wizard step#3: User is able to bulk delete all whitelisted addresses ',
        async function () {
            let result = await tierPage.clickButtonClearAll()
                && await tierPage.waitUntilShowUpPopupConfirm(180)
                && await tierPage.clickButtonYesAlert();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
        });

    test.it('Wizard step#3: All whitelisted addresses are removed after deletion ',
        async function () {
            let result = await tierPage.amountAddedWhitelist(10);
            return await assert.equal(result, 0, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
        });

    test.it('Wizard step#3: field Supply enabled if whitelist was deleted ',
        async function () {
            let result = await tierPage.isDisabledFieldSupply();
            return await assert.equal(result, false, "Test FAILED. Field minCap disabled if whitelist enabled");
        });

    test.it('Wizard step#3:Tier#1: User is able to fill out field "Supply" with valid data',
        async function () {
            tierPage.tier.supply = crowdsaleForUItests.totalSupply;
            let result = await tierPage.fillSupply();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
        });

    test.it('Wizard step#3: User is able to download CSV file with more than 50 whitelisted addresses',
        async function () {
            let fileName = "./public/whitelistedAddresses61.csv";
            let result = await tierPage.uploadWhitelistCSVFile(fileName);

            return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
        });

    test.it('Wizard step#3: Alert present if number of whitelisted addresses greater 50 ',
        async function () {
            let result = await reservedTokensPage.waitUntilShowUpPopupConfirm(100)
                && await reservedTokensPage.clickButtonOk();
            return await assert.equal(result, true, "Test FAILED.ClearAll button is NOT present");
        });

    test.it('Wizard step#3: Number of added whitelisted addresses is correct, data is valid',
        async function () {
            let shouldBe = 50;
            let inReality = await tierPage.amountAddedWhitelist();
            return await assert.equal(shouldBe, inReality, "Test FAILED. Wizard step#3: Number of added whitelisted addresses is NOT correct");

        });

    test.it('Wizard step#3: User is able to bulk delete all whitelisted addresses ',
        async function () {
            let result = await tierPage.clickButtonClearAll()
                && await tierPage.waitUntilShowUpPopupConfirm(180)
                && await tierPage.clickButtonYesAlert();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
        });
    test.it('Wizard step#3: User is able to add several whitelisted addresses one by one ',
        async function () {
            let result = await tierPage.fillWhitelist();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to add several whitelisted addresses");
        });

    test.it('Wizard step#3: User is able to remove one whitelisted address',
        async function () {
            let beforeRemoving = await tierPage.amountAddedWhitelist();
            let numberAddressForRemove = 1;
            await tierPage.removeWhiteList(numberAddressForRemove - 1);
            let afterRemoving = await tierPage.amountAddedWhitelist();
            return await assert.equal(beforeRemoving, afterRemoving + 1, "Test FAILED. Wizard step#3: User is NOT able to remove one whitelisted address");
        });

    test.it('Wizard step#3: User is able to bulk delete all whitelisted addresses ',
        async function () {
            let result = await tierPage.clickButtonClearAll()
                && await tierPage.waitUntilShowUpPopupConfirm(180)
                && await tierPage.clickButtonYesAlert()
                && await tierPage.waitUntilLoaderGone();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
        });

    test.it("Wizard step#3: User is able to set 'Custom Gasprice' checkbox",
        async function () {

            let result = await wizardStep3.clickCheckboxGasPriceCustom();
            return await assert.equal(result, true, "Test FAILED. User is not able to set 'Custom Gasprice' checkbox");

        });

    test.it(" Wizard step#3: User is able to fill out the  'CustomGasprice' field with valid value",
        async function () {
            let customValue = 100;
            let result = await wizardStep3.fillGasPriceCustom(customValue);
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to fill 'Custom Gasprice' with valid value");
        });

    test.it('Wizard step#3: User is able to set SafeAndCheapGasprice checkbox ',
        async function () {
            let result = await wizardStep3.clickCheckboxGasPriceSafe();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: 'Safe and cheap' Gas price checkbox does not set by default");
        });

    test.it("Wizard step#3:Tier#1: User is able to fill out field 'minRate' with valid data",
        async function () {
            tierPage.tier.minRate = 100;
            let result = await tierPage.fillMinRate();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field 'minRate' with valid data");
        });
    test.it("Wizard step#3:Tier#1: User is able to fill out field 'maxRate' with valid data",
        async function () {
            tierPage.tier.maxRate = 10;
            let result = await tierPage.fillMaxRate();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field 'maxRate' with valid data");
        });

    test.it("Wizard step#3: Button 'Continue' disabled if minRate > maxRate ",
        async function () {
            let result = !await wizardStep3.isEnabledButtonContinue();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: Button 'Continue' enabled if minRate > maxRate");

        });
    test.it('Wizard step#3: User is able to fill out field maxRate with valid data ',
        async function () {
            tierPage.tier.maxRate = 1000;
            let result = await tierPage.fillMaxRate();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is not able to fill out field maxRate with valid data");
        });

    test.it("Wizard step#3: Button 'Continue' disabled if crowdsaleSupply>totalSupply",
        async function () {
            tierPage.tier.supply = crowdsaleForUItests.totalSupply + 1;
            let result = await tierPage.fillSupply()
                && !await wizardStep3.isEnabledButtonContinue();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3: Button 'Continue' ensabled if crowdsaleSupply>totalSupply");

        });
    test.it('Wizard step#3:Tier#1: User is able to fill out field Supply with valid data ',
        async function () {
            tierPage.tier.supply = crowdsaleForUItests.totalSupply - 1;
            let result = await tierPage.fillSupply();
            return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field Supply with valid data");

        });
    test.it('Wizard step#3: user is able to proceed to Step4 by clicking button Continue ',
        async function () {
            let result = await wizardStep3.clickButtonContinue()
                && await wizardStep4.waitUntilDisplayedModal(60);
            return await assert.equal(result, true, "Test FAILED. User is not able to open Step4 by clicking button Continue");
        });
    /////////////// STEP4 //////////////
    test.it('Wizard step#4: alert present if user reload the page ',
        async function () {
            await wizardStep4.refresh();
            await driver.sleep(2000);
            let result = await wizardStep4.isPresentAlert();
            return await assert.equal(result, true, "Test FAILED.  Alert does not present if user refresh the page");
        });

    test.it('Wizard step#4: user is able to accept alert after reloading the page ',
        async function () {

            let result = await wizardStep4.acceptAlert()
                && await wizardStep4.waitUntilDisplayedModal(80);
            return await assert.equal(result, true, "Test FAILED. Wizard step#4: Modal does not present after user has accepted alert");
        });

    test.it('Wizard step#4: button SkipTransaction is  presented if user reject a transaction ',
        async function () {
            let result = await wallet.rejectTransaction()
                && await wallet.rejectTransaction()
                && await wizardStep4.isDisplayedButtonSkipTransaction();
            return await assert.equal(result, true, "Test FAILED. Wizard step#4: button'Skip transaction' does not present if user reject the transaction");
        });

    test.it('Wizard step#4: user is able to skip transaction ',
        async function () {

            let result = await wizardStep4.clickButtonSkipTransaction()
                && await wizardStep4.waitUntilShowUpPopupConfirm(80)
                && await wizardStep4.clickButtonYes();
            return await assert.equal(result, true, "Test FAILED.Wizard step#4:  user is not able to skip transaction");
        });

    test.it('Wizard step#4: alert is presented if user wants to leave the wizard ',
        async function () {

            let result = await welcomePage.openWithAlertConfirmation();
            return await assert.equal(result, false, "Test FAILED. Wizard step#4: Alert does not present if user wants to leave the site");
        });

    test.it('Wizard step#4: User is able to stop deployment ',
        async function () {

            let result = await wizardStep4.waitUntilShowUpButtonCancelDeployment(80)
                && await wizardStep4.clickButtonCancelDeployment()
                && await wizardStep4.waitUntilShowUpPopupConfirm(80)
                && await wizardStep4.clickButtonYes();

            return await assert.equal(result, true, "Test FAILED. Button 'Cancel' does not present");
        });

});
