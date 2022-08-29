const main = require('./src/run');
const path = require('path');

const map = new Map();

process.argv.forEach((val, index, array) => {
    if (index > 1) {
        const arr = val.split("=");
        const value = arr[1].toLocaleLowerCase();
        map.set(arr[0], value);
    }
})

console.log(map);

const isFolder = JSON.parse(map.get('runAsSingle'));

const folderPath = path.join(__dirname, '/resources');

main.run(folderPath, map.get('env'), isFolder);