const newman = require('newman');
const fs = require('fs');
const path = require('path');
const bluebird = require('bluebird');
const utils = require('./utils');

let token = "";
const results = [];

const collectionMap = require('../resources/data-mapping/completed_collections.json');
const mapping = require('../resources/data-mapping/mapping.json');

const collectionMapPath = path.join(__dirname, '../resources/data-mapping/completed_collections.json');

Object.filter = function (obj, predicate) {
    let result = {}, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
            result[key] = obj[key];
        }
    }
    return result;
}

async function run(resourcePath, env, runAsSingle = false) {

    const folderPath = path.join(resourcePath, 'collections');
    try {
        // Get the files as an array
        const files = await fs.promises.readdir(folderPath);
        // Loop them all with new for....of
        for (const file of files) {
            // Get the fill paths
            const fromPath = path.join(folderPath, file);
            // Stat the file to see if we have file or dir
            const stat = await fs.promises.stat(fromPath);
            if (stat.isFile()) {
                console.log("'%s' is a file", fromPath);

                const collectionFile = require(fromPath);

                if (isCollectionAlreadyPresent(file) && !isEnvironmentChanged(file, env)) {
                    console.log('this %s collection is already ran!! hence skipping newman run.......', file);
                    continue;
                }

                if (!runAsSingle && collectionFile.item[0].hasOwnProperty('item')) {
                    const folderNames = collectionFile.item.map(c => c.name);

                    // asyncroniously running collections

                    bluebird.map(folderNames, (folder) => {
                        return new Promise((resolve, reject) => {
                            let col = mapping.find(c => c.collectionName === folder);
                            col = col ? col.dataFile : '';
                            runNewManWithFolder(file, fromPath, folder, col, env, resolve, reject);
                        });
                    }).then((result) => {
                        result.forEach(function (result) {
                            let failures = result.run.failures;

                            console.info(failures.length ? JSON.stringify(failures.failures, null, 2) :
                                `${result.collection.name} ran successfully`);

                            console.log("****************API CALLED*****************");
                            console.log(JSON.stringify(result.run.executions[0].item.name));

                            console.log("****************RESULT TIMINGS**************");
                            console.log(JSON.stringify(result.run.stats));

                            console.log("****************RESULT TIMINGS*****************");
                            console.log("responseAverage:" + JSON.stringify(result.run.timings.responseAverage) +
                                " | Started: " + JSON.stringify(result.run.timings.started) +
                                "| Completed: " + JSON.stringify(result.run.timings.completed));

                        });
                    });
                } else {
                    const cname = file.substring(0, file.lastIndexOf("."));
                    let col = mapping.find(c => c.collectionName === cname);
                    col = col ? col.dataFile : '';
                    runNewman(file, collectionFile, col, env);
                }
            } else if (stat.isDirectory()) {
                console.log("'%s' is a directory.", fromPath);
            }
        } // End for...of
    } catch (e) {
        // Catch error
        console.error("We've thrown! Whoops!", e);
    }
};

const addToCompletedCollection = async (collectionName, env) => {

    let isModified = false;

    if (!isCollectionAlreadyPresent(collectionName)) {
        const newCollection = {
            name: collectionName,
            progress: "completed",
            completionDate: new Date(),
            environments: [env]
        };
        collectionMap.collections.push(newCollection);
        isModified = true;
    } else if (isEnvironmentChanged(collectionName, env)) {
        for (let c of collectionMap.collections) {
            if (c.name === collectionName) {
                c.environments.push(env);
                break;
            }
        }
        isModified = true;
    }

    if (isModified) {
        fs.writeFile(collectionMapPath, JSON.stringify(collectionMap, null, 2), function writeJson(err) {
            if (err) return console.log(err);
            console.log('Writing to ' + collectionMapPath);
        });
    }
}

/**
 * Checks if perticular colleciton name is already present in json file
 * @param {*} collectionName
 * @returns true or false
 */
const isCollectionAlreadyPresent = (collectionName) => collectionMap.collections.some(c => c.name === collectionName);
const isEnvironmentChanged = (collectionName, env) => collectionMap.collections.some(c => c.name === collectionName && !c.environments.includes(env));

const runNewman = async (fileName, collectionFile, dataFile, env) => {

    console.log('under runNewman mehtod...');
    console.log("running collection %s with data file %s ", fileName, dataFile);

    try {
        newman.run(utils.generateOptions(collectionFile, env, dataFile, null, fileName), function (err) {
            if (err) { throw err; }
            console.log('collection run complete!');
        })
            .on('start', function (err, args) {
                token = retrieveToken();
            })
            .on('beforeRequest', function (err, args) {
                args.request.header.add({ key: 'authorization', value: token });
                console.log('collection name ', args.item.name);
            })
            .on('request', function (err, args) {
                results.push(args);
            })
            .on('done', function (err, summary) {
                console.log('Adding completed file to completed collection.');
                addToCompletedCollection(fileName, env);
                console.log("Results::::", results);
            });
    } catch (e) {
        console.error('Error while running collection', e);
    }

}

const runNewManWithFolder = async (fileName, collectionFile, folder, dataFile, env, resolve, reject) => {

    console.log('under runNewmanWithFolder mehtod...');
    console.log("running collection %s with data file %s ", fileName, dataFile);

    try {
        newman.run(utils.generateOptions(collectionFile, env, dataFile, folder), function (err) {
            if (err) { throw err; }
            console.log('collection run complete!');
        })
            .on('start', function (err, args) {
                token = retrieveToken();
            })
            .on('beforeRequest', function (err, args) {
                args.request.header.add({ key: 'authorization', value: token });
                console.log('collection name ', args.item.name);
            })
            .on('request', function (err, args) {
                results.push(args);
            })
            .on('done', function (err, summary) {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Adding completed file to completed collection.');
                addToCompletedCollection(fileName, env);
                resolve(summary);
            });
    } catch (e) {
        console.error('Error while running collection', e);
    }

}

function retrieveToken() {
    return 'abc'; // here you can provide your authorization token if availble
}

module.exports = { run: run };