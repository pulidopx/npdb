'use strict';
const fs = require('fs');
let folderName = '';

const unique = (db, cdata, schema, update) => {
    return new Promise(async(resolve, reject) => {
        const data = await read(db) || [];

        const currentSchema = schema.find(sc => sc[db]);
        
        Object.keys(currentSchema).forEach((k) => {
            if (currentSchema[k].require) {

                if(!cdata[k]) {
                    const err = { message: 'Document property, "' + k + '" - is required' }
                    reject(err);
                    throw err;
                }
            }
        });

        if (currentSchema) {
            Object.keys(currentSchema).forEach((key) => {
                if (currentSchema[key].unique) {
                    const exist = data.find(dt => dt[key] === cdata[key]);
                    
                    if (exist) {
                        const err = { message: 'Document repeat not allow : unique - ' + key}
                        reject(err);
                        throw err;
                    }
                }
            })

            Object.keys(cdata).forEach(cd => {
                if (currentSchema[cd].type !== typeof cdata[cd]) {
                    const err = { message: 'Document type property is not valid "' + cd +'" - need ' + currentSchema[cd].type + ' type'}
                    reject(err);
                    throw err;
                }
            });
        }
    
        const id = Math.random().toString(36).slice(-9) + '-' + Math.random().toString(36).slice(-9);
        
        const output = Object.assign(cdata, {
            id: update || id,
            created_date: new Date().getTime(),
            updated_date: update ? new Date().getTime() : null,
        });
        data.push(output)
        resolve({ data, info: output });
    });
}

const create = (db, data, schema, update) => {
    return new Promise( async (resolve, reject) => {
        try {
            let merge = {};
  
            if (!fs.existsSync(folderName)){
              
              fs.mkdirSync(folderName);
            }
            
            if (update) {
                merge = await unique(db, data, schema, update);
            } else {
                merge = await unique(db, data, schema);
            }
             
            let cdata = JSON.stringify(merge.data, null, 2);
        
            fs.writeFile(`${folderName}/${db}.json`, cdata, (err) => {
                if (err) { reject(err); return;};
                resolve(merge.info)
            });
        } catch(err) {
            reject(err);
        }
    });
  };
  
  const read = (db, criteria = null) => {
    return new Promise((resolve, reject) => {

        if (fs.existsSync(`${folderName}/${db}.json`)) {
            fs.readFile(`${folderName}/${db}.json`, 'utf8', (err, data) => {
                if (err) { reject(err); return;};
            
                if (data !== 'undefined') {

                    if (criteria) {
                        const document = JSON.parse(data);

                        const range = [];

                        for (let index = criteria.range.min; index < criteria.range.max + 1; index++) {
                            range.push(index);                            
                        }
                        
                        //console.log('range :', range);
                        const where = (i) => {
                            let isValid = false;
                            const rang = range.find(r => r === i);
                            
                            if (rang || rang === 0) {
                                console.log('object :', i, rang, range);
                                isValid = true;
                            }
                            return isValid;
                        }

                        const res = {
                            rows: document.filter((dt, i) => where(i)),
                            count: document.filter((dt, i) => where(i)).length 
                        }
                                        
                        resolve(res);
                    } else {
                        resolve(JSON.parse(data));
                    }
                } else {
                    resolve(false)
                }
            });
        } else {
            resolve(false)
        }
    })
  }

  const find = (db, criteria, projection = null) => {
    return new Promise((resolve, reject) => {

        const where = (data, criteria) => {
            const properties = Object.keys(data);
            let isValid = false;

            properties.forEach(pr => {
                if (data[pr] === criteria[pr]) {
                    isValid = true;
                }
            });

            return isValid;
        }    

        fs.readFile(`${folderName}/${db}.json`, (err, data) => {
            if (err) { reject(err); return;};
            const filter = JSON.parse(data).filter(dt => where(dt, criteria));
            resolve(filter);
        });
    })
  }

  const remove = (db, id) => {
    return new Promise((resolve, reject) => {

        fs.readFile(`${folderName}/${db}.json`, async (err, data) => {
            if (err) { reject(err); return;};
            const filter = JSON.parse(data).filter(dt => dt.id !== id);

            const fildt = JSON.stringify(filter, null, 2);

            fs.writeFile(`${folderName}/${db}.json`, fildt, (err) => {
                if (err) reject(err);
                console.log('Data written to file');
            });

            resolve('The object is success remove');
            
        });
    })
  }

  const update = (db, id, cdata, schema) => {
    return new Promise((resolve, reject) => {
        const removing = remove;
        const created = create;
        fs.readFile(`${folderName}/${db}.json`, async (err, data) => {
            if (err) { reject(err); return;};

            let schemaValid = true;
            let error = '';
            const currentSchema = schema.find(sc => sc[db]);
        
            Object.keys(currentSchema).forEach((k) => {
                if (currentSchema[k].require) {
    
                    if(!cdata[k]) {
                        schemaValid = false;
                        error = { message: 'Document property, "' + k + '" - is required' }
                    }
                }
            });
    
            const find = JSON.parse(data).find(dt => dt.id === id);
            let info = {};

            if (find && schemaValid) {
                await removing(db, id);
                // console.log('rem :', rem);
                info = await created(db, cdata, schema, id);

                resolve(info);
            } else {
                reject(find ? error : 'The document property no exist');
            }
        });
    })
  }

  module.exports = (schema, path = 'C:/npdb') => {
    folderName = path;

    return {
        create: (db, data) => create(db, data, schema),
        read,
        update: (db, id, data) => update(db, id, data, schema),
        delete: remove,
        // -----
        find,
    }
  };