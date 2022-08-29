const path = require('path');
const Cert = require('./cert');

const certFile = path.join(__dirname, '../resources/certs/<filename.crt>');
const certKey = path.join(__dirname, '../resources/certs/<filename.key>');

const certWithPassword = new Cert(certFile, certKey, 'certpassword');

const env = {
    local: path.join(__dirname, '../resources/environment/DEV.postman_environment.json'),
    dev: path.join(__dirname, '../resources/environment/DEV.postman_environment.json'),
    sit: path.join(__dirname, '../resources/environment/SIT.postman_environment.json')
}

function getEnv(val) {
    if (val) {
        val = val.toLowerCase();
    }
    switch (val) {
        case 'local':
            return env.local;
        case 'dev':
            return env.dev;
        case 'sit':
            return env.sit;
        default:
            console.log("'%s' environment does not exists", val);
    }
}

const certMap = new Map();

certMap.set('local', new Cert()); // new Cert will have null values mean u r not providing cert
certMap.set('dev', new Cert());
certMap.set('sit', new Cert());
// certMap.set('local',certWithPassword); this is how you can attach certificate

function generateOptions(collectionFile, env, dataFile, folder = null, fileName = null) {
    const certs = certMap.get(env);

    console.log("cert key %s , cert file %s and password :::::::::::: %s",
        certs.getKey(), certs.getCert(), certs.getPassword());

    const options = {
        collection: collectionFile,
        environment: getEnv(env),
        reporters: ['htmlextra','cli'],
        reporter: {
            htmlextra: {
                export: path.join(__dirname, `../reports/${env}`, `${folder ? folder : fileName}_report.html`),
                // template: './template.hbs'
                // logs: true,
                // showOnlyFails: true,
                // noSyntaxHighlighting: true,
                // testPaging: true,
                // browserTitle: "My Newman report",
                // title: "My Newman Report",
                // titleSize: 4,
                // omitHeaders: true,
                // skipHeaders: "Authorization",
                // omitRequestBodies: true,
                // omitResponseBodies: true,
                // hideRequestBody: ["Login"],
                // hideResponseBody: ["Auth Request"],
                // showEnvironmentData: true,
                // skipEnvironmentVars: ["API_KEY"],
                // showGlobalData: true,
                // skipGlobalVars: ["API_TOKEN"],
                // skipSensitiveData: true,
                // showMarkdownLinks: true,
                // showFolderDescription: true,
                // timezone: "Australia/Sydney",
                // skipFolders: "folder name with space,folderWithoutSpace",
                // skipRequests: "request name with space,requestNameWithoutSpace",
                // displayProgressBar: true
            }
        }
    };
    if (env.toLowerCase() !== 'local') {
        options.insecure = true;
        options.sslClientCert = certs.getCert();
        options.sslClientKey = certs.getKey();
        options.sslClientPassphrase = certs.getPassword();
    }
    if (folder) {
        options.folder = folder;
    }
    if (dataFile) {
        options.iterationData = path.join(__dirname, '../resources/data-files', dataFile);
    }
    return options;
}

module.exports = { environment: env, certMap: certMap, getEnvironment: getEnv, generateOptions: generateOptions }