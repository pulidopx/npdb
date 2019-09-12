// const schema = require('./schema.json');

const schema = {
    users: {},
    name: {
      type: "string",
      require: true,
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
      type: "number",
      unique: true,
      require: true,
    },
    car: {
      type: "string"
    }
}
const npdb = require('./npdb')(schema);

const findComp = async () => {
    const result = await npdb.find('competidores', {
        created_date: 1567454367581,
        id: 'p3sfkvl0u-a43eh015q',
    });

    console.log('RES () :', result);
}


const updateComp = async () => {
    const result = await npdb.update('users','7lhlidwan-7gtcczbzp', {
        name: "JOSE ALCARAZ SANCHEZ",
        age: 29,
        gender: "Male",
        department: "English",
        car: "AVION"
    });

    console.log('RES () :', result);
}

const createComp = async () => {
  try {
      const result = await npdb.create('competidores', {
        name: "JOSE ALCARAZ SANCHEZ",
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
    const result = await npdb.read('competidores', {
        range: {
            max: 4,
            min: 2
        },
    });

    console.log('RES () :', result);
}

// createComp();
// readComp();
//updateComp();
//findComp();



