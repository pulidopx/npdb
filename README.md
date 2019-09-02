# npdb
Node Physical Data Base. database for electron js and node server

Create physical data in C:/npdb

# ./schema.json

```ruby
[
    {
        "user": {},
        "name": {
            "type": "string",
            "unique": true,
            "require": true
        },
        "age": {
            "type": "numeric"
        }, 
        "gender": {
            "type": "string"
        },
        "department": {
            "type": "string"
        },
        "car": {
            "type": "string"
        }
    },
  ]
```
  
  # ./index.js
  
  ```ruby
  const schema = require('./schema.json');
  const npdb = require('npdb')(schema);
  
  const create = async () => {
   const data = {
      "name": "JOSE ALCARAZ",
      "age": 28,
      "gender": "Male",
      "department": "English",
      "car": "AVION"
   };
   const response = await npdb.create('user', data);
   console.log(response)
  }
  
  const read = async () => {
   const info = await npdb.read('user');
   console.log(info)
  }
  
  const remove = async () => {
   const info = await npdb.delete('user', id);
   console.log(info)
  }
  
  const update = async () => {
   const data = {
      "name": "JOSE ALCARAZ SANCHEZ",
      "age": 29,
      "gender": "Male",
      "department": "English",
      "car": "AVION"
   };
   
   const info = await npdb.update('user', id, data);
   console.log(info)
  }
  
  ```
