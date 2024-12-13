const amqplib = require('amqplib');
const { fork } = require('child_process');

let list = {};

(async () => {
    const queue = 'auto-ads';
    const queue1 = 'message';
    const conn = await amqplib.connect('amqp://ads:huowei.com@184.174.96.54:5672');

    const ch1 = await conn.createChannel();
    await ch1.assertQueue(queue);

    const ch2 = await conn.createChannel();
    await ch2.assertQueue(queue1);

    // Listener
    ch1.consume(queue, (msg) => {
        if (msg !== null) {
            const content = msg.content.toString();
            const payload = JSON.parse(content);

            if(list[payload.cid]) {
                ch1.ack(msg);
                console.log('runing...');
                return;
            }

            list[payload.cid] = true;
 
            // 创建一个新的子进程来处理该消息
            const child = fork('./worker.js'); // worker.js 是处理消息的脚本

            child.send(payload);

            child.on('message', (result) => {

                console.log('子进程处理结果:', result);
                ch2.sendToQueue(queue1, Buffer.from(result.toString()));
                list[payload.cid] = false;
                ch1.ack(msg);
            });

            child.on('error', (err) => {
                console.error('子进程错误:', err);
                ch2.sendToQueue(queue1, Buffer.from(err.toString()));
                ch1.ack(msg);
            });

        } else {

            console.log('Consumer cancelled by server');
            ch2.sendToQueue(queue1, Buffer.from('Consumer cancelled by server'));
        }
    });

    ch2.sendToQueue(queue1, Buffer.from('Rabbitmq connect ok...'));
    console.log('Rabbitmq connect ok...');
})();