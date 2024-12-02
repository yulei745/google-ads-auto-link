function randomChoice(array) {
    if (array.length === 0) {
        throw new Error("Cannot choose from an empty array");
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

async function sleep(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout)
    })
}

module.exports = {
    randomChoice,
    sleep
};