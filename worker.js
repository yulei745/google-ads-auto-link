const { main } = require('./ads');
const {windowbounds} = require('./bit')

process.on('message', async (message) => {
    // 这里是消息处理的逻辑
    console.log('正在处理中:', JSON.stringify(message));

    try {
        await main(message);
    } catch(e) {
        console.log('worker error', e);
    }


    process.send(`处理完成`);
    process.exit(0); // 子进程完成任务后退出
});
