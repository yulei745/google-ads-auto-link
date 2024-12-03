const {getBrowser, switch_page} = require("./ads");
const puppeteer = require("puppeteer");
const utils = require("./utils");
const main = async () => {
    const data = await getBrowser('mcc')

    const browser =  await puppeteer.connect({
        browserWSEndpoint: data.ws,
        defaultViewport: null
    });

    let page = await switch_page(browser, 'bulk/scripts');

    if(!page) {
        page = await browser.newPage();
        await page.goto(`https://ads.google.com/aw/bulk/scripts/management?ocid=6840216126&ascid=6840216126&euid=1208511802&uscid=6840216126`, {timeout: 120000});
    }

    await page.waitForSelector('tab-button.tab-button', {timeout: 120000});

    const btn = await page.$$('tab-button.tab-button');
    await btn[0].click();

    await page.waitForSelector('div.particle-table-row.particle-table-last-row > ess-cell');
    const btn1 = await page.$$('div.particle-table-row.particle-table-last-row > ess-cell');
    await btn1[7].click();

    await utils.sleep(1000);

    const btn2 = await page.$$('script-actions-dropdown material-list-item');
    await btn2[0].click();

    await utils.sleep(1000);

    console.log('run ok');

};

process.on('message', async (message) => {
    // 这里是消息处理的逻辑
    console.log('正在处理中:', JSON.stringify(message));

    await main();

    process.send(`处理完成`);
    process.exit(0); // 子进程完成任务后退出
});
