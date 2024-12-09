const { getBrowser, switch_page } = require("./ads");
const puppeteer = require("puppeteer");
const utils = require("./utils");
const amqplib = require('amqplib');
const { fork } = require('child_process');


let status = false;



(async () => {
    const queue = 'auto-ads-mcc';
    const conn = await amqplib.connect('amqp://ads:huowei.com@184.174.96.54:5672');

    const ch1 = await conn.createChannel();
    await ch1.assertQueue(queue);


    // Listener
    ch1.consume(queue, async (msg) => {
        if (msg !== null) {
            const content = msg.content.toString();
            const payload = JSON.parse(content);

            if(status) {
                console.log('runing...');
                ch1.ack(msg);
                return;
            }

            status = true;

            try {
                await main(payload);
            } catch(e) {
                console.log(e);
            }

            status = false;
            ch1.ack(msg);

            // 创建一个新的子进程来处理该消息
            // const child = fork('./worker-mcc.js'); // worker.js 是处理消息的脚本

            // // 向子进程发送消息
            // child.send(payload);

            // // 监听子进程处理完成的消息
            // child.on('message', (result) => {

            //     console.log('子进程处理结果:', result);
            //     // 确认消息已被处理
            //     ch1.ack(msg);
            // });

            // // 监听子进程的错误
            // child.on('error', (err) => {
            //     console.error('子进程错误:', err);
            //     ch1.ack(msg);
            // });

        } else {
            console.log('Consumer cancelled by server');
        }
    });
    console.log('Rabbitmq connect ok...');
})();


const main = async () => {
    const data = await getBrowser('mcc')

    const browser =  await puppeteer.connect({
        browserWSEndpoint: data.ws,
        defaultViewport: null
    });

    let page = await switch_page(browser, 'bulk/scripts');

    if(!page) {
        page = await browser.newPage();
    }

    await page.goto(`https://ads.google.com/aw/bulk/scripts/management?ocid=6840216126&ascid=6840216126&euid=1208511802&uscid=6840216126`, {timeout: 120000});


    await page.waitForSelector('tab-button.tab-button', {timeout: 120000});

    const btn = await page.$$('tab-button.tab-button');
    await btn[0].click();

    await utils.sleep(5000);

    await page.waitForSelector('div.particle-table-row.particle-table-last-row > ess-cell');
    const btn1 = await page.$$('div.particle-table-row.particle-table-last-row > ess-cell');
    await btn1[7].click();

    await utils.sleep(1000);

    const btn2 = await page.$$('script-actions-dropdown material-list-item');
    await btn2[0].click();

    await utils.sleep(1000);

    console.log('run ok');

};