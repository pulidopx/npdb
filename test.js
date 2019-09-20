// const schema = require('./schema.json');

const schema = [{
    users: {},
    name: {
      type: "string",
      require: true,
      unique: true,
    },
    age: {
      type: "number",
      require: true,
    },
    gender: {
      type: "string",
      require: true,
    },
    department: {
      type: "string",
      require: true,
    },
    car: {
      type: "string"
    }
}];

const path = 'C:/testPath';

const npdb = require('./npdb')(schema, path);

const findComp = async () => {
    const result = await npdb.find('users', {
        created_date: 1567454367581,
        id: 'p3sfkvl0u-a43eh015q',
    });

    console.log('RES () :', result);
}


const updateComp = async () => {
    const result = await npdb.update('users','196lsygkt-c0bn5mus4', {
      "name": "JOSE ALCARAZ SAN AABB",
      "age": 34,
      "gender": "Male",
      "department": "English",
      "car": "AVION",
    });

    console.log('RES () :', result);
}

const createComp = async () => {
  try {
      const result = await npdb.create('users', {
        name: "JOSE ALCARAZ SAN AA",
        age: 29,
        gender: "Male",
        department: "English",
        car: "AVION"
    });

    console.log('RES () :', result);
  } catch (err) {
    console.log('err :', err);
  }
}

const readComp = async () => {
    const result = await npdb.read('users', {
        range: {
            max: 4,
            min: 2
        },
    });

    console.log('RES () :', result);
};

const multiUpdate = async () => {

  try {
    const result = await npdb.multiUpdate('users', [
      'prafme9nj-9q1kphixr',
      'a0u5xqvyk-wr00yzypo',
      '196lsygkt-c0bn5mus4'
    ], [
      {
        name: "JOSE ALCARAZ SANCHEZ ABDUL",
        age: 29,
        gender: "Male",
        department: "English",
        car: "AVION",
        id: 'prafme9nj-9q1kphixr'
      },
      {
        name: "JOSE ALCARAZ SANCHEZ EOEO",
        age: 29,
        gender: "Male",
        department: "English",
        car: "AVION",
        id: 'a0u5xqvyk-wr00yzypo'
      },
      {
        name: "JOSEPH ALWAYS EOEO",
        age: 33,
        gender: "Male",
        department: "English",
        car: "AVION",
        id: '196lsygkt-c0bn5mus4'
      }
    ]);
  
    // console.log('RES', result);
  } catch(err) {
    console.log('error :', err);
  }
}

multiUpdate();
// createComp();
// readComp();
// updateComp();
// findComp();



