import * as loki from 'lokijs';
import * as LokiFSStructuredAdapter from 'lokijs/src/loki-fs-structured-adapter';
import * as fs from 'fs';
import * as path from 'path';

export const connection = new Promise<Loki>((resolve, reject) => {
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
