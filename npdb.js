'use strict';
const fs = require('fs');
let folderName = '';
let bcrypt = require('bcrypt');

const unique = (db, cdata, schema, update, folder, date, multiple, iterator) => {
    return new Promise(async(resolve, reject) => {
        let data = await read(db, null, folder) || [];
        let isPassword = false;
        let namePasswordProp = '';
        if (update && !multiple) {
            data = data.filter(dt => dt.id !== update);
        }

        const currentSchema = schema.find(sc => sc[db]);

        Object.keys(currentSchema).forEach((k) => {
            isPassword = currentSchema[k].password;
            namePasswordProp = isPassword ? k : '';

            if (currentSchema[k].require) {

                const findedBool = typeof cdata[k] === 'boolean'; // Boolean(String(cdata[k]));
                const finded = cdata[k] === 0 ? '0' : ( findedBool || cdata[k] );
                if(!finded) {
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


        if (isPassword) {
            cdata[namePasswordProp] = bcrypt.hashSync(cdata[namePasswordProp], 10);
        }
        console.log('date =============> :', date, iterator);
        const output = Object.assign(cdata, {
            id: update || id,
            created_date: update ? date : new Date().getTime(),
            updated_date: update ? new Date().getTime() : null,
        });
        data.push(output)
        resolve({ data, info: output });
    });
}


const uniqueFunction = (db, cdata, schema, update, folder, date, multiple, cb) => {
    read(db, null, folder)
        .then((data) => {
            
            let isPassword = false;
            let err = null;
            let namePasswordProp = '';
            if (update && !multiple) {
                data = data.filter(dt => dt.id !== update);
            }

            const currentSchema = schema.find(sc => sc[db]);

            Object.keys(currentSchema).forEach((k) => {
                isPassword = currentSchema[k].password;
                namePasswordProp = isPassword ? k : '';

                if (currentSchema[k].require) {

                    const findedBool = typeof cdata[k] === 'boolean'; // Boolean(String(cdata[k]));
                    const finded = cdata[k] === 0 ? '0' : ( findedBool || cdata[k] );
                    if(!finded) {
                        err = { message: 'Document property, "' + k + '" - is required', error: true }
                    }
                }
            });

            if (currentSchema) {
                Object.keys(currentSchema).forEach((key) => {
                    if (currentSchema[key].unique) {
                        const exist = data.find(dt => dt[key] === cdata[key]);

                        if (exist) {
                            err = { message: 'Document repeat not allow : unique - ' + key, error: true }

                        }
                    }
                })

                Object.keys(cdata).forEach(cd => {
                    if (currentSchema[cd].type !== typeof cdata[cd]) {
                        err = { message: 'Document type property is not valid "' + cd +'" - need ' + currentSchema[cd].type + ' type', error: true }
                        
                    }
                });
            }

            const id = Math.random().toString(36).slice(-9) + '-' + Math.random().toString(36).slice(-9);


            if (isPassword) {
                cdata[namePasswordProp] = bcrypt.hashSync(cdata[namePasswordProp], 10);
            }

            const output = Object.assign(cdata, {
                id: update || id,
                created_date: update ? date : new Date().getTime(),
                updated_date: update ? new Date().getTime() : null,
            });
            data.push(output)
            cb(err || { data, info: output });
        })
}

const create = (db, data, schema, update, folder = null, date) => {
    return new Promise( async (resolve, reject) => {
        try {

            let merge = {};

            if (!fs.existsSync(folderName)){

              fs.mkdirSync(folderName);
            }

            if (update) {
                merge = await unique(db, data, schema, update, folder, date);
            } else {
                merge = await unique(db, data, schema, null, folder);
            }

            const putData = sortData(merge.data);

            let cdata = JSON.stringify(putData, null, 2);

            waiting_process(async () => {
                let pathing = '';
                if (folder && folder.split('-')[1]) {
                    pathing = folder ? `${folderName}/${db}/${folder.split('-')[0]}/${folder.split('-')[1]}.json` : `${folderName}/${db}.json`;
                } else {
                    pathing = folder ? `${folderName}/${db}/${folder}.json` : `${folderName}/${db}.json`;
                }


                if(!fs.existsSync(pathing)) {
                    const fd = folder ? `${folderName}/${db}/${folder.split('-')[0] || folder}` : `${folderName}/`;
                    fs.promises.mkdir(fd, { recursive: true }).then(() => {
                        fs.writeFile(pathing, cdata, (err) => {
                            if (err) {reject(err); return;};
                            resolve(merge.info)
                        });
                    })
                    .catch((err) => reject(err));
                   
                } else {
                    fs.writeFile(pathing, cdata, (err) => {
                        if (err) {reject(err); return;};
                        resolve(merge.info)
                    });
                }
            }, 500)
        } catch(err) {
            reject(err);
        }
    });
};

  const read = (db, criteria = null, folder = null) => {
    return new Promise((resolve, reject) => {
        waiting_process(() => {

            let pathing = '';
            if (folder && folder.split('-')[1]) {
                pathing = folder ? `${folderName}/${db}/${folder.split('-')[0]}/${folder.split('-')[1]}.json` : `${folderName}/${db}.json`;
            } else {
                pathing = folder ? `${folderName}/${db}/${folder}.json` : `${folderName}/${db}.json`;
            }

            if (fs.existsSync(pathing)) {
                fs.readFile(pathing, 'utf8', (err, data) => {
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
        }, 300)
    })
  }

  const find = (db, criteria, folder = null) => {
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

        let pathing = '';
        if (folder && folder.split('-')[1]) {
            pathing = folder ? `${folderName}/${db}/${folder.split('-')[0]}/${folder.split('-')[1]}.json` : `${folderName}/${db}.json`;
        } else {
            pathing = folder ? `${folderName}/${db}/${folder}.json` : `${folderName}/${db}.json`;
        }

        fs.readFile(pathing, (err, data) => {
            if (err) { reject(err); return;};
            const filter = JSON.parse(data).filter(dt => where(dt, criteria));
            resolve(filter);
        });
    })
  }

  const remove = (db, id, folder = null) => {
    return new Promise((resolve, reject) => {
        let pathing = '';
        if (folder && folder.split('-')[1]) {
            pathing = folder ? `${folderName}/${db}/${folder.split('-')[0]}/${folder.split('-')[1]}.json` : `${folderName}/${db}.json`;
        } else {
            pathing = folder ? `${folderName}/${db}/${folder}.json` : `${folderName}/${db}.json`;
        }

        fs.readFile(pathing, 'utf8', async (err, data) => {
            if (err) { reject(err); return;};
            const arr = [];
            let filter = JSON.parse(data);

            filter.forEach(e => {
                if (e.id !== id) {
                    arr.push(e);
                }
            })

            const fildt = JSON.stringify(sortData(arr));

            fs.writeFile(pathing, fildt, (err) => {
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

            console.log('REMOVE PER ONE ________| :', arr);
            let filter = arr;

            resolve(filter);
        });
    })
  }

  const update = (db, id, cdata, schema, folder = null) => {
    return new Promise((resolve, reject) => {
        const created = create;
        delete cdata.id;
        delete cdata.created_date;
        delete cdata.updated_date;

        waiting_process(() => {
            let pathing = '';
            if (folder && folder.split('-')[1]) {
                pathing = folder ? `${folderName}/${db}/${folder.split('-')[0]}/${folder.split('-')[1]}.json` : `${folderName}/${db}.json`;
            } else {
                pathing = folder ? `${folderName}/${db}/${folder}.json` : `${folderName}/${db}.json`;
            }

            fs.readFile(pathing, async (err, data) => {
                if (err) { reject(err); return;};

                let schemaValid = true;
                let error = '';
                const currentSchema = schema.find(sc => sc[db]);

                Object.keys(currentSchema).forEach((k) => {
                    if (currentSchema[k].require) {
                        const findedBool = typeof cdata[k] === 'boolean'; // Boolean(String(cdata[k]));
                        const finded = cdata[k] === 0 ? '0' : ( findedBool || cdata[k] );
                        if(!finded) {
                            schemaValid = false;
                            error = { message: 'Document property, "' + k + '" - is required' }
                        }
                    }
                });

                const find = JSON.parse(data).find(dt => dt.id === id);

                let info = {};

                if (find && schemaValid) {
                  try {
                    info = await created(db, cdata, schema, id, folder, find.created_date);
                    resolve(info);
                  } catch (err) {
                    reject(err);
                  }
                } else {
                    reject(find ? error : 'The document property no exist');
                }
            });
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
                        const date = find.created_date;
                        delete find.id;
                        delete find.created_date;
                        delete find.updated_date;
                        console.log('multidate :', date, find, ids.length, i, ids);
                        if (ids.length) {
                            uniqueFunction(db, find, schema, up, null, date, true, (uniq) => {
                                if (uniq.error) throw uniq.message;
                                console.log('uniq :', uniq);
                                arrayInfo.push(uniq.data);
                            })
                        }
                    } catch(err) {
                        console.log('error: ', err);
                        reject(err.message);
                    }
                }
        });

        console.log('arrayInfoarrayInfo :', arrayInfo);
        resolve(arrayInfo);

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

        waiting_process(() => {
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
                                const body = sortData(data.concat(removeData));
                                console.log('object :', data, removeData);
                                let setdata = JSON.stringify(body);

                                fs.writeFile(`${folderName}/${db}.json`, setdata, (err) => {
                                    if (err) { reject(err); return;};
                                    resolve(setdata)
                                });
                            })
                            .catch(err => { console.log('error: ', err); reject(err) });
                        }).catch(err => { console.log('error: ', err); reject(err) });
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    });
  }

  const comparePassword = (db, schema, id, password) => {
    return new Promise((resolve, reject) => {

        fs.readFile(`${folderName}/${db}.json`, 'utf8', async (err, data) => {
            if (err) { reject(err); return;};

            let nameProperty = '';
            const currentSchema = schema.find(sc => sc[db]);
            const arr = JSON.parse(data).filter(dt => dt.id === id)[0];

            Object.keys(currentSchema).forEach(k => {
               if (currentSchema[k].password) {
                   nameProperty = k;
               }
            });

            if (arr) {
                const entryPassword = bcrypt.hashSync(password, 10);
                const result = bcrypt.compare(entryPassword, arr[nameProperty]);

                if (result) {
                    resolve({
                        valid: true,
                        message: 'contraseña correcta'
                    });
                } else {
                    reject('contraseña no coincide');
                }
                
            } else {
                reject('error inesperado')
            }
        });
    })
  }

  const sortData = (data = []) => {
    return data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  const readFolder = (db, folder) => {
    return new Promise((resolve, reject) => {
        const fd = folder ? `${folderName}/${db}/${folder}` : `${folderName}/${db}`;
        console.log('fd :', fd);
        fs.readdir(fd, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files)  
            }      
        });
    });
  }

  const waiting_process = (method, wait = 2000) => {
    const process = {};
    process.wait = setTimeout(method, wait);
    process.wait = null;
  }

  module.exports = (schema, path = 'C:/npdb') => {
    folderName = path;

    return {
        create: (db, data, folder) => create(db, data, schema, null, folder),
        read,
        update: (db, id, data, folder) => update(db, id, data, schema, folder),
        delete: remove,
        // -----
        find,
        multiUpdate: (db, ids, data) => multiUpdate(db, ids, data, schema),
        comparePassword: (db, id, password) => comparePassword(db, schema, id, password),
        readFolder,
    }
  };
