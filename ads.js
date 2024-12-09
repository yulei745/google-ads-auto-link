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
            bitdata.name = name;
            const res = await createBrowser(bitdata);
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
                    try {
                        const listcampaignId = await page.evaluate(node => node.querySelector('ess-cell[essfield="campaign_id"]').textContent.trim(), node);
                        const listcid = await page.evaluate(node => node.querySelector('ess-cell[essfield="entity_owner_info.descriptive_name"] a.ess-cell-link')?.textContent.trim(), node);
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


const bitdata = {
    "code": "20241203171512654",
    "groupId": "2c9bc0478e3a5344018e3b6d3f656e61",
    "platform": "",
    "platformIcon": "",
    "url": "https%3A%2F%2Fads.google.com%2Faw%2Fcampaigns%3Focid%3D6840216126%26ascid%3D6840216126%26euid%3D1208511802%26__u%3D7850129898%26uscid%3D6840216126%26__c%3D5073920974%26authuser%3D0",
    "name": "mcc",
    "userName": "",
    "password": "",
    "cookie": "[{\"name\":\"S\",\"value\":\"adwords-frontend-reporting=ANAufMyHNUC2QHVRWcpOHiizyHF5uB6N1pAfE8-setg\",\"domain\":\".ads.google.com\",\"path\":\"/aw_reporting/reporteditor\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"S\",\"value\":\"adwords-frontend-mcc=ZQNMVksqLZSCiJ96vRUcVkS4veGlzINsOwEfch6nmbA\",\"domain\":\".ads.google.com\",\"path\":\"/aw_accountsettings\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"S\",\"value\":\"adwords-frontend-bulk=matrMjW45XBUlbApwcvNkm4GIUcz-FVcCvdfwSZuwhI\",\"domain\":\".ads.google.com\",\"path\":\"/aw_bulk\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"S\",\"value\":\"adwords-frontend-mcc=YtY_6FvFWzrsttx5dVWcCAQiSxpkbavn7N7gVSHXpY8\",\"domain\":\".ads.google.com\",\"path\":\"/aw_mcc\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"NID\",\"value\":\"519=ASwuzd_ib3bJwCPKtZ3P5bZRNaqgK4LjkKLC4bSgajwSPdA8RcpFmHpdmVxuu5GDXHNdAp_XgsjNskVnFE1AecD2JEs0qQnCXhaXx0VVksyi9hoTV5e-sJ8XVE575t3-BXX9CbOSfTPiPDjSphFrf03VB6JzpayCYt-DrRmnFJcqykcJTYFi-28qn_ZX-8-tAzLPl4OQ\",\"domain\":\".google.com.hk\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"_gcl_au\",\"value\":\"1.1.1346244071.1733217332\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"_gid\",\"value\":\"GA1.3.992903177.1733217333\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"ar_debug\",\"value\":\"1\",\"domain\":\".doubleclick.net\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"IDE\",\"value\":\"AHWqTUkhlBqEKiQ0G78hJCVYriqa0gTEcNDpKnpW-qmaiSlds3AMNSUW_oHAVf4M\",\"domain\":\".doubleclick.net\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"id\",\"value\":\"22615c8b2bf500ab||t=1733217332|et=730|cs=002213fd489221bb3dadbb47e4\",\"domain\":\".doubleclick.net\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"receive-cookie-deprecation\",\"value\":\"1\",\"domain\":\".doubleclick.net\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"OTZ\",\"value\":\"7848556_24_24__24_\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"NID\",\"value\":\"519=cLyyN4ruhzosmKny_s-PgSWxroTiVbkUjIPMmDxBkpVDfWNinPYjYZJj_5vRJlQLFZKE-T32n5MsMscJGJzTPB9RPhYx-iNtb8CCnftSF7rxVb6lxFq8h3NsdkGiCV7GXJMnUYmKKTBBWrbYKIAY52GajM-dliX37ZIvHFHBHf3TCj3V8R9VFezwYiN83uJEfw-ax6MRgYujNnHe8KGmBpeS806ipRR7zuYwTmw9Rb1skT2dQUd7pt9juj135DvdGzie9N21BXKRScj0MIg2TWMnIvIGvX3mBlz3tqfpj54XkYkMNWODonPVRb6HabUplvfyzAPqGRhyTQjZ81puHCwgmwf9wrI9OYYgoaRRFzrnTd7-n1zVSTLTRTHIlsQYb78956IHe5b3_0-ZS80QeaSWttUUSA8A_RXEyFJmj926p7MrxgFe8969lXleR-55MsB6XIeyNy0ekLt6ugRPq3v6qQ3XkE1lVzhkN72iMXzvLVnJYjNfPTujvU-4SkxAEpqtMxlc-kzSIAOOeLB90-mfkNRh5PSU-xm5M9U2BkUM9r7ySH32ZkMiiIfGuiIUqRL4FhThdBxi-B3ZNw1UBslCa0Dbi9lGl4sFl3STGSKXtrLwOmL2WMeNXNofjCF4-q2i-p5gbtVqX4SeZ9cUOZXgRI9lyNXVPfOKuEa9n0RHeJYiil0t_JEylramTjZGF6dhcw\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"SID\",\"value\":\"g.a000qwjhLeifjBttgWHRG_XNhfhHcuWi_F3VFAPVQPH2BYTLFx7YkC3CbftoyuWt-P2qI2NymQACgYKATMSARESFQHGX2Mi4938oWabBl7z3aHv-LtppxoVAUF8yKq1DN4PnYFhm5iCNX6Nrvkq0076\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-1PSID\",\"value\":\"g.a000qwjhLeifjBttgWHRG_XNhfhHcuWi_F3VFAPVQPH2BYTLFx7YoYuE_FWCXmY0p1c7EfYYMAACgYKAQcSARESFQHGX2Mizux6GCPkpGP1FtlrAjpimhoVAUF8yKorp1uGEZNd7COZ3GGpikvl0076\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-3PSID\",\"value\":\"g.a000qwjhLeifjBttgWHRG_XNhfhHcuWi_F3VFAPVQPH2BYTLFx7Yq5gYGgVuaU8MYeBGP6GqlAACgYKAeoSARESFQHGX2MiBOCU6iwz3hi1n1Q07LGKcBoVAUF8yKoYxsQSS_ntH5PCcjciKiVM0076\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"HSID\",\"value\":\"ARhuncuX2j-9NmQ2J\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"SSID\",\"value\":\"ALScXnb8YX5ZwOVUO\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"APISID\",\"value\":\"MkptqVDsJAB8tSTJ/AxUA63Q3PpDVAzp8z\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"SAPISID\",\"value\":\"6Fh60wvX7HRqPAE3/AyxgF_C_b4MHiHqJW\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-1PAPISID\",\"value\":\"6Fh60wvX7HRqPAE3/AyxgF_C_b4MHiHqJW\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-3PAPISID\",\"value\":\"6Fh60wvX7HRqPAE3/AyxgF_C_b4MHiHqJW\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"__Host-GAPS\",\"value\":\"1:diOqZUVYlARPWV8dDFMTDnavEmlcLB96n3twRevpdHYtccrhd4R1ETvIAVDqvr0unMZ3n7kcCtreRBdWe60shXdY9RaAmg:fsLcx-2_wDCGO98-\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"SMSV\",\"value\":\"ADHTe-Crjf0I5BG-yKFJB4GhpJSpL25IEVdAr9PkuBmHEOb82oScfEV5b8KPKpUdP4ugC8XNBuaVrU0tw0q798stG62JbUHPgrMs08cdntLTWWR13ELvzP8\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"ACCOUNT_CHOOSER\",\"value\":\"AFx_qI52HJ3ZwntnXNGoyo_XCMyVc83ztNLj-81h3HsL21b5W0B9xX03dsS9gxgSNwUNs0bFIqafuvXcprDirKeyPsME6Ixq2In8Dbo38WQcJaXVg9sDoYg\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"OSID\",\"value\":\"g.a000qwjhLRRD0MYm8QsoHlzBJ4LLDpqPR0DTbqzS5EpobggmkY3Q-wL5FP64hl2lX8H_bXD4dgACgYKARISARESFQHGX2Mip6lk3pO_wwjpihQZX-XzlBoVAUF8yKpxTmSNH2DrgeQbjJaJFg3U0076\",\"domain\":\"myaccount.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-OSID\",\"value\":\"g.a000qwjhLRRD0MYm8QsoHlzBJ4LLDpqPR0DTbqzS5EpobggmkY3Q9Fco_pg7Nk_xGa3eVeab5wACgYKAdMSARESFQHGX2Mi0lKECSeZg60Fq3jmOqYHOBoVAUF8yKoW1UViQBUhWAEU_bZnK5Km0076\",\"domain\":\"myaccount.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"OTZ\",\"value\":\"7848556_24_24__24_\",\"domain\":\"gds.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"LSID\",\"value\":\"o.ads.google.com|o.gds.google.com:g.a000qwjhLVNanzGtBICXJtYTdsjKf4DZhgGdfZEBThT7LFMNNgLwLKHQEpamPsp674JOXRPBXwACgYKAacSARESFQHGX2Mi2icfo_vdzQ-69B8v3FqBmhoVAUF8yKo0HXwW-o1-O9vqGlL6rd9v0076\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Host-1PLSID\",\"value\":\"o.ads.google.com|o.gds.google.com:g.a000qwjhLVNanzGtBICXJtYTdsjKf4DZhgGdfZEBThT7LFMNNgLwWqDk4qjM02uvDq1oO4BdWQACgYKAUsSARESFQHGX2MiynVvPZF5azuzBNKrCfVQrRoVAUF8yKoNotIxwLAYxgx6SciPhxig0076\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Host-3PLSID\",\"value\":\"o.ads.google.com|o.gds.google.com:g.a000qwjhLVNanzGtBICXJtYTdsjKf4DZhgGdfZEBThT7LFMNNgLwdzynXJnwT26rPJONXq9H8wACgYKAUESARESFQHGX2MipVckulJbBt_xB8gmxByVBhoVAUF8yKrzQ71StYy1NMWVtBmjTWmh0076\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"OSID\",\"value\":\"g.a000qwjhLWWlRdehaP3jlZjwrfSikSDVI7qcopnf4XgYoC0lt1QcA45SLnf3jiCh6fMRlluFZAACgYKAWMSARESFQHGX2MiIbvaH01BLdSnnkDPuxodURoVAUF8yKq5P-A2QCsx8kpC8twfpKAG0076\",\"domain\":\"ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-OSID\",\"value\":\"g.a000qwjhLWWlRdehaP3jlZjwrfSikSDVI7qcopnf4XgYoC0lt1Qcw41ixvE-aDTjPfu7__wNBwACgYKATESARESFQHGX2Mi_h2Dq76cuMZBnuK1QbWiaRoVAUF8yKoCHN6k6ZVAr2tHfQlAjVMd0076\",\"domain\":\"ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"AdsUserLocale\",\"value\":\"zh_CN\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"adwordsReferralSource\",\"value\":\"sourceid=emp&subid=cn-zh-cn-awhp-g-aw-c-home-signin!o2-ahpm-0000000169-0000000001&clickid=\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"ADS_VISITOR_ID\",\"value\":\"00000000-0000-0000-0000-000000000000\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"_ga\",\"value\":\"GA1.1.1013585443.1733217332\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"S\",\"value\":\"acx-adwords-navigation-frontend=Ww28r6rqCxk966j8oC5ElpnUiwMdiDGRW3qeYgPImDM\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"receive-cookie-deprecation\",\"value\":\"1\",\"domain\":\".doubleclick.net\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"ADS_CUSTOMER_ACCOUNT_SESSION_INFO\",\"value\":\"ScCigAoksJDxsxFQz4ZP-GxBm5_virC_X-dyl1lI4m0=authuser-0\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-APFE_CI\",\"value\":\"ANh9YQdo+am/c3YJ3TSKVLe+POMJfA8Cq0/z7p4hIub6cYhb1lpEh9mRwil9PkXmPK4w6K2Pg52cV/18Aw==\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"OTZ\",\"value\":\"7848587_24_24__24_\",\"domain\":\"ogs.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"LSOLH\",\"value\":\"_SVI_EO3vlJWpi4oDGBAiP01BRURIZl9xcUdsQmc1VElneFB3S3N6aXpzOHFFRDRkbG10WjZWTWp4MkRrcGYwRldzUk5hbFZ5UkRZem03RQ_:28887003:23ee\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false},{\"name\":\"_ga_HR9MP6ENEP\",\"value\":\"GS1.1.1733303181.3.0.1733303181.0.0.0\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"_ga_V9K47ZG8NP\",\"value\":\"GS1.1.1733225065.3.0.1733225065.60.0.0\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"_ga_J51Y85KVRZ\",\"value\":\"GS1.1.1733225065.3.0.1733225065.60.0.0\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"_ga_6WWNF0Z6T6\",\"value\":\"GS1.1.1733225065.3.1.1733225074.0.0.0\",\"domain\":\".ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-APFE_CI\",\"value\":\"ANh9YQdsl/ftgflE3MvA/VswSpyqvOfYAgXcimUaPKJrc3bJdUw4H9/caLWWNXKmLfFBgQDcqms+BLkcDg==\",\"domain\":\"ads.google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"SIDCC\",\"value\":\"AKEyXzV1JRQas3QlKCIEaiIlp_BlNBakHWlzpzmgnRzf41IJv9n_ZtKBif1lkI3q3-czJU8Go7A\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-1PSIDCC\",\"value\":\"AKEyXzUak5aXplNn-kkVbNXxBcgzaMEiurqdomtKQzHO94KiZn70I6rg6HrKJGgs3j8b_5rv64Q\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false},{\"name\":\"__Secure-3PSIDCC\",\"value\":\"AKEyXzWzPrmeLb2FAJzePnOleP7nB7-UFaOAzCo3SmbvO9UT7jRaWBTBCZvoTk7pY0Uw7rwfyu4\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1765262357,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false}]",
    "otherCookie": "",
    "isGlobalProxyInfo": false,
    "isIpv6": false,
    "proxyMethod": 2,
    "proxyType": "noproxy",
    "agentId": "",
    "ipCheckService": "ip123in",
    "host": "",
    "proxyUserName": "",
    "proxyPassword": "",
    "lastIp": "210.21.87.114",
    "lastCountry": "中国(CN)",
    "isIpNoChange": false,
    "ip": "",
    "country": "",
    "province": "",
    "city": "",
    "dynamicIpChannel": "",
    "dynamicIpUrl": "",
    "isDynamicIpChangeIp": true,
    "remark": "",
    "status": 0,
    "operUserName": "",
    "operTime": "2024-12-09 14:38:57",
    "closeTime": "2024-12-09 14:39:18",
    "isDelete": 0,
    "delReason": "",
    "isMostCommon": 0,
    "isRemove": 0,
    "tempStr": null,
    "createdBy": "2c9bc0478e3a5344018e3b6d3f656e61",
    "userId": "2c9bc0478e3a5344018e3b6d3f656e61",
    "createdTime": "2024-12-03 17:15:13",
    "updateBy": "2c9bc0478e3a5344018e3b6d3f656e61",
    "updateTime": "2024-12-03 18:16:33",
    "recycleBinRemark": "",
    "mainUserId": "2c9bc06189d8ba3f0189e730475c1c6a",
    "abortImage": false,
    "abortMedia": false,
    "stopWhileNetError": false,
    "stopWhileCountryChange": false,
    "syncTabs": true,
    "syncCookies": true,
    "syncIndexedDb": false,
    "syncBookmarks": false,
    "syncAuthorization": true,
    "syncHistory": false,
    "syncGoogleAccount": true,
    "allowedSignin": false,
    "syncSessions": false,
    "workbench": "localserver",
    "clearCacheFilesBeforeLaunch": false,
    "clearCookiesBeforeLaunch": false,
    "clearHistoriesBeforeLaunch": false,
    "randomFingerprint": false,
    "muteAudio": false,
    "disableGpu": false,
    "enableBackgroundMode": false,
    "abortImageMaxSize": 0,
    "syncExtensions": false,
    "syncUserExtensions": false,
    "syncLocalStorage": false,
    "credentialsEnableService": false,
    "disableTranslatePopup": false,
    "stopWhileIpChange": false,
    "disableClipboard": false,
    "disableNotifications": false,
    "memorySaver": false,
    "groupName": "huowei003-API默认分组",
    "browserFingerPrint": {
        "id": "158f1d85749648d5a22bf7614dfcf328",
        "seq": 48464,
        "coreVersion": "130",
        "browserId": "03d29c917ff9420a800f650aced457aa",
        "ostype": "PC",
        "os": "Win32",
        "architecture": "x86",
        "osVersion": "",
        "platformVersion": "10.0.0",
        "version": "",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.71 Safari/537.36",
        "isIpCreateTimeZone": true,
        "timeZone": "",
        "timeZoneOffset": 0,
        "ignoreHttpsErrors": false,
        "webRTC": "3",
        "position": "1",
        "isIpCreatePosition": true,
        "isIpCreateDisplayLanguage": false,
        "displayLanguages": "",
        "isIpCreateLanguage": true,
        "languages": "",
        "resolutionType": "0",
        "resolution": "1920 x 1080",
        "openWidth": 1280,
        "openHeight": 720,
        "fontType": "0",
        "font": "Kokonor,Apple Chancery,Cochin,Khmer MN,Sitka Text,Trattatello,Mongolia Baiti Regular,Segoe UI Semilight,Segoe UI Emoji Regular,Segoe UI Historic",
        "canvas": "0",
        "canvasValue": "610725",
        "webGL": "0",
        "webGLValue": "291126",
        "webGLMeta": "0",
        "webGLManufacturer": "Google Inc. (NVIDIA)",
        "webGLRender": "ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D9Ex vs_3_0 ps_3_0, nvldumd.dll-27.21.14.5671)",
        "audioContext": "0",
        "audioContextValue": "100",
        "mediaDevice": "1",
        "speechVoices": "0",
        "speechVoicesValue": "[{\"name\":\"Microsoft David - English (United States)\",\"default\":true,\"lang\":\"en-US\",\"is_remote\":false,\"voice_uri\":\"Microsoft David - English (United States)\"},{\"name\":\"Microsoft Richard - English (Canada)\",\"default\":false,\"lang\":\"en-CA\",\"is_remote\":false,\"voice_uri\":\"Microsoft Richard - English (Canada)\"},{\"name\":\"Microsoft Linda - English (Canada)\",\"default\":false,\"lang\":\"en-CA\",\"is_remote\":false,\"voice_uri\":\"Microsoft Linda - English (Canada)\"},{\"name\":\"Microsoft Mark - English (United States)\",\"default\":false,\"lang\":\"en-US\",\"is_remote\":false,\"voice_uri\":\"Microsoft Mark - English (United States)\"},{\"name\":\"Microsoft Zira - English (United States)\",\"default\":false,\"lang\":\"en-US\",\"is_remote\":false,\"voice_uri\":\"Microsoft Zira - English (United States)\"},{\"name\":\"Microsoft Caroline - French (Canada)\",\"default\":false,\"lang\":\"fr-CA\",\"is_remote\":false,\"voice_uri\":\"Microsoft Caroline - French (Canada)\"},{\"name\":\"Microsoft Claude - French (Canada)\",\"default\":false,\"lang\":\"fr-CA\",\"is_remote\":false,\"voice_uri\":\"Microsoft Claude - French (Canada)\"},{\"name\":\"Microsoft Nathalie - French (Canada)\",\"default\":false,\"lang\":\"fr-CA\",\"is_remote\":false,\"voice_uri\":\"Microsoft Nathalie - French (Canada)\"},{\"name\":\"Google Deutsch\",\"default\":false,\"lang\":\"de-DE\",\"is_remote\":true,\"voice_uri\":\"Google Deutsch\"},{\"name\":\"Google US English\",\"default\":false,\"lang\":\"en-US\",\"is_remote\":true,\"voice_uri\":\"Google US English\"},{\"name\":\"Google UK English Female\",\"default\":false,\"lang\":\"en-GB\",\"is_remote\":true,\"voice_uri\":\"Google UK English Female\"},{\"name\":\"Google UK English Male\",\"default\":false,\"lang\":\"en-GB\",\"is_remote\":true,\"voice_uri\":\"Google UK English Male\"},{\"name\":\"Google español\",\"default\":false,\"lang\":\"es-ES\",\"is_remote\":true,\"voice_uri\":\"Google español\"},{\"name\":\"Google español de Estados Unidos\",\"default\":false,\"lang\":\"es-US\",\"is_remote\":true,\"voice_uri\":\"Google español de Estados Unidos\"},{\"name\":\"Google français\",\"default\":false,\"lang\":\"fr-FR\",\"is_remote\":true,\"voice_uri\":\"Google français\"},{\"name\":\"Google हिन्दी\",\"default\":false,\"lang\":\"hi-IN\",\"is_remote\":true,\"voice_uri\":\"Google हिन्दी\"},{\"name\":\"Google Bahasa Indonesia\",\"default\":false,\"lang\":\"id-ID\",\"is_remote\":true,\"voice_uri\":\"Google Bahasa Indonesia\"},{\"name\":\"Google italiano\",\"default\":false,\"lang\":\"it-IT\",\"is_remote\":true,\"voice_uri\":\"Google italiano\"},{\"name\":\"Google 日本語\",\"default\":false,\"lang\":\"ja-JP\",\"is_remote\":true,\"voice_uri\":\"Google 日本語\"},{\"name\":\"Google 한국의\",\"default\":false,\"lang\":\"ko-KR\",\"is_remote\":true,\"voice_uri\":\"Google 한국의\"},{\"name\":\"Google Nederlands\",\"default\":false,\"lang\":\"nl-NL\",\"is_remote\":true,\"voice_uri\":\"Google Nederlands\"},{\"name\":\"Google polski\",\"default\":false,\"lang\":\"pl-PL\",\"is_remote\":true,\"voice_uri\":\"Google polski\"},{\"name\":\"Google português do Brasil\",\"default\":false,\"lang\":\"pt-BR\",\"is_remote\":true,\"voice_uri\":\"Google português do Brasil\"},{\"name\":\"Google русский\",\"default\":false,\"lang\":\"ru-RU\",\"is_remote\":true,\"voice_uri\":\"Google русский\"},{\"name\":\"Google 普通话（中国大陆）\",\"default\":false,\"lang\":\"zh-CN\",\"is_remote\":true,\"voice_uri\":\"Google 普通话（中国大陆）\"},{\"name\":\"Google 粤語（香港）\",\"default\":false,\"lang\":\"zh-HK\",\"is_remote\":true,\"voice_uri\":\"Google 粤語（香港）\"},{\"name\":\"Google 國語（臺灣）\",\"default\":false,\"lang\":\"zh-TW\",\"is_remote\":true,\"voice_uri\":\"Google 國語（臺灣）\"}]",
        "hardwareConcurrency": "8",
        "deviceMemory": "8",
        "deviceInfoEnabled": true,
        "computerName": "DESKTOP-5B671B8D",
        "macAddr": "E4-FD-45-DD-82-12",
        "clientRectNoiseEnabled": true,
        "clientRectNoiseValue": 79043,
        "doNotTrack": "0",
        "portScanProtect": "0",
        "portWhiteList": "",
        "isDelete": 0,
        "colorDepth": 24,
        "totalDiskSpace": "2437808128",
        "devicePixelRatio": 1,
        "disableSslCipherSuitesFlag": false,
        "disableSslCipherSuites": null,
        "plugins": "",
        "enablePlugins": false,
        "windowSizeLimit": true,
        "createdBy": "2c9bc0478e3a5344018e3b6d3f656e61",
        "createdTime": "2024-12-03 17:15:13",
        "isValidUsername": true,
        "abortImage": false,
        "abortImageMaxSize": null,
        "abortMedia": false,
        "stopWhileNetError": false,
        "stopWhileCountryChange": false,
        "syncTabs": true,
        "syncCookies": true,
        "syncIndexedDb": false,
        "syncBookmarks": false,
        "syncAuthorization": false,
        "syncHistory": false,
        "syncGoogleAccount": false,
        "allowedSignin": false,
        "syncSessions": false,
        "workbench": "localserver",
        "clearCacheFilesBeforeLaunch": false,
        "clearCookiesBeforeLaunch": false,
        "clearHistoriesBeforeLaunch": false,
        "randomFingerprint": false,
        "muteAudio": false,
        "disableGpu": false,
        "enableBackgroundMode": false,
        "syncExtensions": false,
        "syncUserExtensions": false,
        "syncLocalStorage": false,
        "credentialsEnableService": false,
        "disableTranslatePopup": false,
        "stopWhileIpChange": false,
        "disableClipboard": false,
        "disableNotifications": false,
        "memorySaver": false,
        "coreProduct": "chrome",
        "webgpu": {
            "driver": null,
            "vendor": "nvidia",
            "description": null,
            "device": null,
            "architecture": "pascal"
        },
        "batchRandom": false,
        "batchUpdateFingerPrint": false,
        "firefoxVersionMap": null,
        "launchArgs": "",
        "uamodel": "",
        "extendOptions": null,
        "randomPlatformVersion": null,
        "defaultAccuracy": 10
    },
    "createdName": null,
    "belongUserName": null,
    "updateName": null,
    "agentIpCount": null,
    "belongToMe": true,
    "seqExport": null,
    "groupIDs": null,
    "browserShareID": null,
    "share": null,
    "shareUserName": null,
    "isShare": 0,
    "isValidUsername": true,
    "createNum": 0,
    "isRandomFinger": true,
    "remarkType": 1,
    "refreshProxyUrl": null,
    "duplicateCheck": 0,
    "ossExtend": null,
    "randomKey": "f89902d56122585308a141fbe504bce1f7ec59351fe1335a7c1d1d87dc72bfcb",
    "randomKeyUser": null,
    "syncBrowserAccount": "",
    "cookieBak": "",
    "passwordBak": null,
    "manual": 0,
    "proxyPasswordBak": null,
    "proxyAgreementType": null,
    "clearCacheWithoutExtensions": false,
    "syncPaymentsAndAddress": false,
    "extendIds": [
        "2c9bc047931ee91b01932dcb7fff74b9"
    ],
    "isSynOpen": 1,
    "faSecretKey": null,
    "coreProduct": "chrome",
    "ostype": null,
    "os": null,
    "sort": 0,
    "checkPassword": null
};

module.exports = {
    main,
    bitbrowser,
    getBrowser,
    switch_page
}