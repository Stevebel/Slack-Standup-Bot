const loki = require('lokijs');
const LokiFSStructuredAdapter = require("lokijs/src/loki-fs-structured-adapter");
const fs = require('fs');
const path = require('path');

const connectionPromise = new Promise((resolve, reject) => {
    // Setup data directory
    const dir = './data';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        fs.mkdir(dir, onDirectoryReady);
    }else{
        onDirectoryReady();
    }

    function onDirectoryReady(){
        // Create / Load Database files
        var adapter = new LokiFSStructuredAdapter();

        let db = new loki(path.join(dir,'data.json'), { 
            adapter : adapter,
            autoload: true,
            autoloadCallback : () => resolve(db),
            autosave: true, 
            autosaveInterval: 4000
        });
    }
});

module.exports = connectionPromise;
