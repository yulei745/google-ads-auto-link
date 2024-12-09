const config = require("./config");
const utils = require("./utils");
const bit = require("./bit");
const puppeteer = require("puppeteer");
const URLParse = require("url-parse");
const fs = require("fs");

module.exports = async function(cam) {
    
    const link = cam.offer;
    let browser_id;

    const ipmart = link.ipmart.split(':');//config.ipmart.split(':');

    try {
        const random_windowname = 'auto-ads'; //generate_random_str()
        const body = {
            'name': 'auto-' + random_windowname,
            'proxyMethod': 2,  // 代理方式 2自定义 3 提取IP
            'proxyType': 'socks5', // 代理类型  ['noproxy', 'http', 'https', 'socks5', 'ssh']
            'host': ipmart[0],  // 代理主机
            'port': ipmart[1],  // 代理端口
            'proxyUserName': ipmart[2],
            'proxyPassword': ipmart[3],
            'url':'',
            'abortImage':false,
            'abortImageMaxSize':0,
            'syncIndexedDb':true,
            'syncLocalStorage':true,
            'syncBookmarks':true,
            'syncAuthorization':true,
            'syncHistory':true,
            'stopWhileNetError':false,
            'muteAudio':true,
            'allowedSignin':true,
            'clearCacheFilesBeforeLaunch':false,
            'clearCacheWithoutExtensions':false,
            'clearCookiesBeforeLaunch':false,
            'clearHistoriesBeforeLaunch':false,
            'randomFingerprint':false,
            'browserFingerPrint': {
                'coreProduct': 'chrome', // 内核，chrome|firefox，默认chrome，需要火狐内核时，填firefox
                'coreVersion': '128', // 内核版本，chrome默认选最新内核，可选    118，104，注意win7/win8/win server2012 已经不支持112内核，请指定104内核，firefox默认120，win8以下不支持火狐内核
                'ostype': 'PC', // 操作系统平台 PC|Android|IOS
                'os': 'Win32', // 为navigator.platform值 Win32 | Linux x86_64 | MacIntel，当ostype设置为IOS时，设置os为iPhone，ostype为Android时，设置为 Linux armv81
                'osVersion': '', // 操作系统版本，不填时，按照os随机，填了以后，按照所填的值范围内随机，windows候选项 11|10|8|7，Android候选项13|12|11|10|9，iOS候选 17.0|16.6|16.5|16.4|16.316.2|16.1|16.0|15.7|15.6|15.5|15.4|15.3|15.2|15.1|15.0，可填多个值，逗号分隔，比如windows: '11,10'
                'version': '', //浏览器版本，不填则随机
                'userAgent': '', // ua，不填则自动生成
                'isIpCreateTimeZone': true, // 基于IP生成对应的时区
                'timeZone': '', // 时区，isIpCreateTimeZone 为false时，参考附录中的时区列表
                'timeZoneOffset': 0, // isIpCreateTimeZone 为false时设置，时区偏移量
                'webRTC': '0', //webrtc 0替换|1允许|2禁止|3隐私
                'ignoreHttpsErrors': false, // 忽略https证书错误，true|false
                'position': '1', //地理位置 0询问|1允许|2禁止
                'isIpCreatePosition': true, // 是否基于IP生成对应的地理位置
                'lat': '', // 经度 isIpCreatePosition 为false时设置
                'lng': '', // 纬度 isIpCreatePosition 为false时设置
                'precisionData': '', //精度米 isIpCreatePosition 为false时设置
                'isIpCreateLanguage': true, // 是否基于IP生成对应国家的浏览器语言
                'languages': '', // isIpCreateLanguage 为false时设置，值参考附录
                'isIpCreateDisplayLanguage': true, // 是否基于IP生成对应国家的浏览器界面语言
                'displayLanguages': '', // isIpCreateDisplayLanguage 为false时设置，默认为空，即跟随系统，值参考附录
                // 'openWidth': 1280, // 窗口宽度
                // 'openHeight': 720, // 窗口高度
                // 'resolutionType': '2', // 分辨率类型 0跟随电脑 | 1自定义
                // 'resolution': '1920 x 1080', // 自定义分辨率时，具体值
                'windowSizeLimit': false, // 分辨率类型为自定义，且ostype为PC时，此项有效，约束窗口最大尺寸不超过分辨率
                'devicePixelRatio': 1, // 显示缩放比例，默认1，填写时，建议 1｜1.5|2|2.5|3
                'fontType': '0', // 字体生成类型 0系统默认|1自定义|2随机匹配
                'font': '', // 自定义或随机匹配时，设置的字体值，值参考附录字体
                'canvas': '0', //canvas 0随机｜1关闭
                'canvasValue': null, // canvas为0随机时设置， 噪音值 10000 - 1000000
                'webGL': '0', //webGL图像，0随机｜1关闭
                'webGLValue': null, // webGL为0时，随机噪音值 10000 - 1000000
                'webGLMeta': '0', //webgl元数据 0自定义｜1关闭
                'webGLManufacturer': '', // webGLMeta 自定义时，webGL厂商值，建议留空会自动生成
                'webGLRender': '', // webGLMeta自定义时，webGL渲染值，建议留空自动生成
                'audioContext': '0', // audioContext值，0随机｜1关闭
                'audioContextValue': null, // audioContext为随机时，噪音值， 1 - 100 ，关闭时默认10
                'speechVoices': '0', // Speech Voices，0随机｜1关闭
                'speechVoicesValue': null, // speechVoices为0时，随机时由系统自动生成
                'hardwareConcurrency': utils.randomChoice(['4','6','8','12','16']), // 硬件并发数
                'deviceMemory': utils.randomChoice(['4','8']), // 设备内存，1，2，4，8，不要传入大于8的值
                'doNotTrack': '1', // doNotTrack 1开启｜0关闭
                'clientRectNoiseEnabled': true, // ClientRects true使用相匹配的值代替您真实的ClientRects | false每个浏览器使用当前电脑默认的ClientRects
                'clientRectNoiseValue': 0, // clientRectNoiseEnabled开启时随机，值 1 - 999999
                'portScanProtect': '0', // 端口扫描保护 0开启｜1关闭
                'portWhiteList': '', // 端口扫描保护开启时的白名单，逗号分隔
                'deviceInfoEnabled': true, // 自定义设备信息，默认开启
                'computerName': '', // deviceInfoEnabled 为true时，设置
                'macAddr': '', // deviceInfoEnabled 为true时，设置
                'disableSslCipherSuitesFlag': false, // ssl是否禁用特性，默认不禁用，注意开启后自定义设置时，有可能会导致某些网站无法访问
                'disableSslCipherSuites': null, // ssl 禁用特性，序列化的ssl特性值，参考附录
                'enablePlugins': false, // 是否启用插件指纹
                'plugins': '' // enablePlugins为true时，序列化的插件值，插件指纹值参考附录
            }

        };
        const res = await bit.createBrowser(body);

        if(!res.success) {
            return;
        }

        browser_id = res.data.id;

        console.log(browser_id);
        const data = {
            id: browser_id,
            args: ['--headless']
        };

        const open_res = await bit.openBrowser(data); //--headless
        if(!open_res.success) {
            return;
        }
        console.log(open_res.data.ws);
        const browser =  await puppeteer.connect({
            browserWSEndpoint: open_res.data.ws
        });

        const page = await browser.newPage();

        // 启用请求拦截
        await page.setRequestInterception(true);

        // 拦截并过滤掉图片请求
        page.on('request', (request) => {
            if (['document'].includes(request.resourceType())) {
                request.continue(); // 允许 HTML 文档加载
            } else {
                request.abort(); // 其他请求都中止
            }
        });


        // Navigate the page to a URL
        await page.goto(link.landurl, { waitUntil: 'domcontentloaded' });
        await page.evaluate(async (url) => {
            const a = document.createElement('a');
            a.href = url;
            a.click();
        }, link.offerurl);

        let find = false;
        for(let i = 0; i < 20; i++) {
            const rawUrl = await page.url();
            const url = new URLParse(rawUrl);
            console.log(rawUrl);

            if(url.hostname.indexOf(link.offerdomain) >= 0) {
                console.log('find url:', rawUrl);
                find = true;
                break;
            }

            await utils.sleep(3000);
        }

        if(!find) {
            await bit.closeBrowser(browser_id);
            await bit.deleteBrowser(browser_id);
            return;
        }

        await bit.closeBrowser(browser_id);
        await bit.deleteBrowser(browser_id);

        return page.url();

    } catch(e) {
        console.log('err', e);
        if(browser_id) {
            await bit.closeBrowser(browser_id);
            await utils.sleep(2000);
            await bit.deleteBrowser(browser_id);
        }
    }
    return '';
}