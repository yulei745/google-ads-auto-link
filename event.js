const { getBrowser, switch_page } = require("./ads");
const puppeteer = require("puppeteer");
const utils = require("./utils");



const amqplib = require('amqplib');
const { fork } = require('child_process');

(async () => {
    const queue = 'auto-ads-mcc';
    const conn = await amqplib.connect('amqp://ads:huowei.com@184.174.96.54:5672');

    const ch1 = await conn.createChannel();
    await ch1.assertQueue(queue);

    // Listener
    ch1.consume(queue, (msg) => {
        if (msg !== null) {
            const content = msg.content.toString();
            const payload = JSON.parse(content);

            // 创建一个新的子进程来处理该消息
            const child = fork('./worker-mcc.js'); // worker.js 是处理消息的脚本

            // 向子进程发送消息
            child.send(payload);

            // 监听子进程处理完成的消息
            child.on('message', (result) => {

                console.log('子进程处理结果:', result);
                // 确认消息已被处理
                ch1.ack(msg);
            });

            // 监听子进程的错误
            child.on('error', (err) => {
                console.error('子进程错误:', err);
                ch1.ack(msg);
            });

        } else {
            console.log('Consumer cancelled by server');
        }
    });
    console.log('Rabbitmq connect ok...');
})();

