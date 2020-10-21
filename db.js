const mongodb = require('mongodb');
const url = 'mongodb://localhost:27017';

class Db {
    static getInstance () {
        return new Promise ( (resolve, reject) => {
            if(!Db.instance) {
                mongodb.connect(url, (err, client) => {
                    Db.instance = client.db('light');
                    console.log("Connected successfully to server");
                    return resolve(Db.instance);
                })
            } else {
                return resolve(Db.instance);
            }
        })
    }
} 

module.exports = Db;