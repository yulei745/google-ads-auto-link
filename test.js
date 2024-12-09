const {getBrowser} = require('./ads');
const puppeteer = require('puppeteer');
const utils = require('./utils');

const data1 = {
    cid: '707-326-4923',
    adsurl: msg.env.adsurl,
    campaigns: [
        {
            name: 'frank and oak',
            campaignId: '21894191935',
            offer: {
                landurl: 'https://comparealliance.com/',
                offerurl: 'https://c.duomai.com/track.php?aid=35915&dm_fid=16079&euid=%7B%7BDATETIME%7D%7D&ref=1082072&t=https%3A%2F%2Fwww.frankandoak.com%2F',
                offerdomain: 'frankandoak.com',
                finaurl: '',
                ipmart: 'proxy.ipmart.io:2000:nZ80o955eh-res-CA:yulei123',
            }
        }
    ]
};
const data = {
    '707-326-4923': [
        {
            name: 'frank and oak',
            campaignId: '21894191935',
            offer: {
                landurl: 'https://comparealliance.com/',
                offerurl: 'https://c.duomai.com/track.php?aid=35915&dm_fid=16079&euid=%7B%7BDATETIME%7D%7D&ref=1082072&t=https%3A%2F%2Fwww.frankandoak.com%2F',
                offerdomain: 'frankandoak.com',
                finaurl: '',
                ipmart: 'proxy.ipmart.io:2000:nZ80o955eh-res-CA:yulei123',
            }
        }
    ]
};


const main = async () => {
    // const data = await fetch('http://localhost:9222/json/version')
    // .then(response => response.json());

    // const browser =  await puppeteer.connect({
    //     browserWSEndpoint: data.webSocketDebuggerUrl,
    //     defaultViewport: null
    // });

    // const page = await browser.newPage();

    // await page.goto('https://ads.google.com/aw/campaigns?ocid=6840216126&euid=1208511802&uscid=6840216126&authuser=3&ascid=6840216126');

    
    for(let cid in data) {
        const cams = data[cid];
        for(let cam of cams) {
            
            await searchAds(page, cam.name);
            
        }
    }






};

main();


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


async function replaceLink(page, cid, campaignId) {
    await page.waitForSelector('div.particle-table-row', {timeout: 120000, visible: true});

    const list = await page.$$('div.particle-table-row');

    list.forEach(async node => {
        try {
            const listcampaignId = await page.evaluate(a => node.querySelector('ess-cell[essfield="campaign_id"]').textContent, node).trim();
            const listcid = await page.evaluate(a => node.querySelector('ess-cell[essfield="entity_owner_info.descriptive_name"] a.ess-cell-link').textContent, node).trim();
            if (campaignId && cid) {
                return (listcid == cid && campaignId == listcampaignId) ? node : null;
            }
        } catch (e) {
            console.error("Error while processing node:", e);
        }
        return null;
    })
}