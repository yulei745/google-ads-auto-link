// https://ads.google.com/aw/campaigns?ocid=6651183108&workspaceId=0&euid=1207172394&__u=1897532506&uscid=6651183108&__c=4398398692&authuser=2&subid=sg-en-awhp-g-aw-c-home-signin%21o2-adshp-hv-q4-22-ahpm-0000000169-0000000001&ascid=6651183108
//
// https://ads.google.com/aw/campaigns?ocid=1389260567&ascid=1389260567&euid=1207172394&__u=1897532506&uscid=6651183108&__c=4398398692&authuser=2&subid=sg-en-awhp-g-aw-c-home-signin%21o2-adshp-hv-q4-22-ahpm-0000000169-0000000001
//
// https://ads.google.com/aw/campaigns?ocid=1522187212&ascid=1522187212&euid=1207172394
// https://ads.google.com/aw/campaigns?ocid=6734570601&ascid=6734570601&euid=1207172394


const puppeteer = require('puppeteer');
const {createBrowser, openBrowser, getBrowserList} = require("./bit");
const utils = require("./utils");
const getLink = require('./getLink');

// const ads = [
//     {
//         adsurl: 'https://ads.google.com/aw/campaigns?ocid=6734570601&ascid=6734570601&euid=1207172394',
//         campaigns: [
//             {
//                 name: 'JD-1121-01',
//                 offer: {
//                     landurl: `https://cuttingedgemensgear.com/b-by-ben-sherman-collection/`,
//                     offerurl: `https://clickecomdms.com/?a=187353&c=379483&co=319836&mt=36&redirection_url=https%3A%2F%2Fprf.hn%2Fclick%2Fcamref%3A1011lkDmX%2Fpubref%3A`,
//                     offerdomain: `hm.com`,
//                     finaurl: ''
//                 }
//             }
//         ]
//     }
// ];

async function getBrowser(name = 'google-ads'){
    try {
        const res = await getBrowserList({
            name,
            page: 0,
            pageSize: 1
        });
        let id = '';
        if(res.success && res.data.list.length) {
            const data = res.data.list.pop();
            id = data.id;
        } else {
            const res = await createBrowser({
                proxyMethod: 2,
                proxyType: 'noproxy',
                browserFingerPrint: {},
            });
            if(res.success) {
                id = res.data.id;
            }
        }

        const openRes = await openBrowser({id});
        if(openRes.success) {
            return openRes.data;
        }
        return false;
    } catch (e) {
        console.error(e);
    }
    return false;
}

async function bitbrowser() {
    try {
        const res = await createBrowser({
            proxyMethod: 2,
            proxyType: 'noproxy',
            browserFingerPrint: {},
        });
        if(res.success) {
            const openRes = await openBrowser({id: res.data.id});
            if(openRes.success) {
                return openRes.data;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return false;
}


async function main(ads) {
    const data = await getBrowser(ads.cid)

    const browser =  await puppeteer.connect({
        browserWSEndpoint: data.ws,
        defaultViewport: null
    });

    try {
        await replaceLink(browser, ads);
    } catch (e) {
        console.log('cid error:', e);
    }
}


async function replaceLink(browser, ads) {
    let page = await browser.newPage();
    await page.goto('https://ads.google.com/aw/campaigns?ocid=6840216126&euid=1208511802&uscid=6840216126&authuser=3&ascid=6840216126', {timeout: 120000});

    for(let cam of ads.campaigns) {
        try {

            cam.offer.finaurl = 'https://voila.ca/?irclickid=2xM1dRTidxyKWsb2KKXrE3p0UkCVeEzdrX5rW00&utm_medium=Impact&utm_source=affiliate&utm_campaign=FANSTOSHOP&irgwc=1';//await getLink(cam);
            if(!cam.offer.finaurl) {
                return;
            }

            await searchAds(page, cam.name);

            await page.waitForSelector('div.particle-table-row', {timeout: 120000, visible: true});

            const list = await page.$$('div.particle-table-row');

            const nodes = await Promise.all(
                list.map(async node => {
                    console.log(node);
                    try {
                        const listcampaignId = await page.evaluate(node => node.querySelector('ess-cell[essfield="campaign_id"]').textContent.trim(), node);
                        const listcid = await page.evaluate(node => node.querySelector('ess-cell[essfield="entity_owner_info.descriptive_name"] a.ess-cell-link').textContent.trim(), node);
                        if (listcampaignId && listcid) {
                            return (listcid == ads.cid && cam.campaignId == listcampaignId) ? node : null;
                        }
                    } catch (e) {
                        console.error("Error while processing node:", e);
                    }
                    return null;
                })
            );

            // 过滤出非 null 的元素
            const filteredNodes = nodes.filter(n => n !== null);

            if(!filteredNodes.length) return;

            const node = filteredNodes.pop();

            try {
                console.log('find: ', cam.name);
                const settingbtn = await node.$('material-button.edit-panel-icon-button');
                await settingbtn.click();

                await page.waitForSelector('material-button.additional-settings-button', {timeout: 120000});
                const setting = await page.$('material-button.additional-settings-button');
                await setting.click();

                const campaignUrlSetting = await page.$('construction-plugin-panel[section_id="57.12"]');

                const buttondecorator = await campaignUrlSetting.$('div[buttondecorator]');
                await buttondecorator.click();

                await campaignUrlSetting.waitForSelector('input');
                const inputs = await campaignUrlSetting.$$('input');
                const offerfinaurl = cam.offer.finaurl.split('?');

                await inputs[1].focus(); // 聚焦输入框
                await page.keyboard.down('Control'); // 按下 Ctrl 键
                await page.keyboard.press('A'); // 选择所有内容
                await page.keyboard.up('Control'); // 释放 Ctrl 键
                await page.keyboard.press('Backspace'); // 按下 Backspace 清空内容

                await inputs[1].type(offerfinaurl[1]);
                await page.mouse.wheel({ deltaY: 400 });  // 向下滚动 100px

                const btnyes = await campaignUrlSetting.$('material-button.btn.btn-yes');
                console.log('save');

                await btnyes.click();

                await campaignUrlSetting.waitForSelector('input:nth-of-type(1)', { hidden: true, timeout: 60000 });

                const close = await page.$('material-fab.slidealog-close-icon');
                await close.click();
            } catch (e) {
                console.log('edit campaigns error:', e);
            }

            console.log(cam.name, ' set ok');

        } catch (e) {
            console.log('campaigns error:', e);
        }
    }

}

async function searchAds(page, camname) {
    await page.waitForSelector('div[stickyclass="sticky"] dropdown-button > div.button', {timeout: 120000, visible: true});

    const search = await page.$('div[stickyclass="sticky"] dropdown-button > div.button');

    await search.click();

    await utils.sleep(2000);

    const input = Array.from(await page.$$('div.popup-wrapper')).filter(async node => {
        const text = await page.evaluate(node => node.textContent, node);
        return text.indexOf('查找广告') >= 0;
    }).pop();

    await input.type(camname);

    await input.waitForSelector('material-select-dropdown-item', {timeout: 120000, visible: true});

    const results = await page.$$('material-select-dropdown-item');
    await results[0].click();
}

async function switch_page(browser, search) {
    // 获取所有已打开的页面
    const pages = await browser.pages();
    console.log('当前已打开的页面列表:');
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const url = await page.url();
        console.log(`页面 ${i + 1}: ${url}`);
    }
    let page = pages.find(page => page.url().indexOf(search) > 0);
    if(!page) return false;
    await page.bringToFront();
    return page;
}

module.exports = {
    main,
    bitbrowser,
    getBrowser,
    switch_page
}