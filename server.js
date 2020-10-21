const express = require('express');
const bodyParser = require('body-parser');
const { toNamespacedPath } = require('path');
const { json } = require('express');
const Db = require('./db');
const ObjectID = require('mongodb').ObjectID;

const app = express();

const methods = require('./components/components');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: false } ));

app.use(async (req, res, next) => {
    const db = await Db.getInstance();
    const countLog = {
        url: req.url,
        json: req.body,
        date: (new Date()).toJSON()
    };
    db.collection("logs").insert(countLog, (err, result) => {
        if (err) {
            console.log(`Log was not recorded! ${err}`);
            next();
        }
        console.log(`Log was recorded`);
        next();
    })
});

app.post("/", methods.createOrder)

app.put('/order-queue/:username/:id', methods.statusChanger)

app.get("/order-queue/:username/statistics", methods.statistic)

app.get("/logs", methods.getLog)

Db.getInstance().then( () => {
    app.listen(3030, () => {
        console.log('Api app works!')
    });
}).catch(console.error);