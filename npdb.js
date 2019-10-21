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
             
            const putData = sortData(merge.data);

            let cdata = JSON.stringify(putData, null, 2);
        
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
                        resolve(data ? JSON.parse(data) : []);
                    }
                } else {
                    resolve([])
                }
            });
        } else {
            resolve([])
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
        fs.readFile(`${folderName}/${db}.json`, 'utf8', async (err, data) => {
            if (err) { reject(err); return;};
            const arr = [];
            let filter = JSON.parse(data);

            filter.forEach(e => {
                if (e.id !== id) {
                    arr.push(e);
                }
            })

            const fildt = JSON.stringify(sortData(arr));

            fs.writeFile(`${folderName}/${db}.json`, fildt, (err) => {
                if (err) reject(err);
                console.log('Data written to file');
            });

            resolve('The object is success remove');
            
        });
    })
  }

  const removePerOne = (db, ids) => {
    return new Promise((resolve, reject) => {

        fs.readFile(`${folderName}/${db}.json`, 'utf8', async (err, data) => {
            if (err) { reject(err); return;};

            const arr = [];

            JSON.parse(data).forEach((e, i) => {
                if (!ids.find(f => f === e.id)) {
                    arr.push(e);
                }
            });

            
            let filter = arr;

            const fildt = JSON.stringify(sortData(filter));

            fs.writeFile(`${folderName}/${db}.json`, fildt, (err) => {
                if (err) reject(err);
                console.log('Data written to file');
                resolve(filter)
            });    
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
                    const finded = cdata[k] === 0 ? '0' : cdata[k]
                    if(!finded) {
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

  const multiCheck = (ids = [], putData, data, schema, db) => {
      return new Promise((resolve, reject) => {
        const arrayInfo = [];

        ids.forEach(async (up, i) => {
            const updateData = putData.find(pd => pd.id === up);
                if (updateData) {
                    try {
                        const find = JSON.parse(data).find(dt => dt.id === up);
                        
                        Object.keys(updateData).forEach(k => {
                            const property = find[k] === 0 ? '0' : find[k];

                            if (property) {
                                find[k] = updateData[k]
                            }
                        });
                        delete find.id;
                        delete find.created_date;
                        delete find.updated_date;

                        unique(db, find, schema, up)
                            .then(uniq => {
                                arrayInfo.push(uniq.info);
                                if ((ids.length - 1) === i) {
                                    resolve(arrayInfo);
                                }
                            })
                            .catch(err => { console.log('err: ', err); });
                    } catch(err) {
                        console.log('error: ', err);
                        reject(err.message);
                    }
                }  
        });   
    
      })
  }

  const checkDocumentProperties = (ids, putData, data) => {
    let error = false;
    let messageError = '';

    ids.forEach((up) => {
        const updateData = putData.find(pd => pd.id === up);
        const find = JSON.parse(data).find(dt => dt.id === up);
        if (find && updateData) {
            Object.keys(updateData).forEach(k => {
                const property = find[k] === 0 ? '0' : find[k];
                
                if (!property) {
                    // console.log('Property : ', typeof property)
                    error = true;
                    messageError = 'The current set property not exist in the file, try again with valid property data';
                }
            });
        } else {
            error = true;
            if (updateData && updateData.id) {
                messageError = `The id document ${updateData.id} not exist`;
            } else {
                messageError = 'Semantic error please check the ids properties';
            }
        }
    });

    return { error, messageError }
  }

  const multiUpdate = (db, ids, cdata, schema) => {
    return new Promise((resolve, reject) => {
        
        const removing = removePerOne;
        const putData = cdata;
        

        fs.readFile(`${folderName}/${db}.json`, 'utf8', async (err, data) => {
            if (err) { reject(err); return;};

            try {
                const check = checkDocumentProperties(ids, putData, data);

                if (check.error) {
                    reject(check.messageError);
                } else {
                    removing(db, ids).then((removeData) => {
                    
                        multiCheck(ids, putData, data, schema, db)
                        .then(data => {
                            const putData = sortData(data.concat(removeData));

                            let setdata = JSON.stringify(putData, null, 2);
                            
                            fs.writeFile(`${folderName}/${db}.json`, setdata, (err) => {
                                if (err) { reject(err); return;};
                                resolve(setdata)
                            });
                        })
                        .catch(err => { console.log('error: ', err); reject(err) });
                    }).catch(err => { console.log('error: ', err); reject(err) });   
                }
            } catch (err) {
                console.log('error:', err);
                reject(err);
            }
        });

        
    });
  }

  const sortData = (data = []) => {
    return data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
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
        multiUpdate: (db, ids, data) => multiUpdate(db, ids, data, schema),
    }
  };