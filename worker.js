const { main } = require('./ads');

process.on('message', async (message) => {
    // 这里是消息处理的逻辑
    console.log('正在处理中:', JSON.stringify(message));

    process.send(`处理完成`);
    process.exit(0); // 子进程完成任务后退出

    return;

    await main(message);

    process.send(`处理完成`);
    process.exit(0); // 子进程完成任务后退出
});
