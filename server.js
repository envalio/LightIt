const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const { toNamespacedPath } = require('path');
const { json } = require('express');
const ObjectID = require('mongodb').ObjectID;

const app = express();

let db;
const url = 'mongodb://localhost:27017';

const components = require('./controllers/components')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: false } ));

// app.use((req, res, next) => {
//     const countLog = {
//         url: req.url,
//         json: req.body,
//         date: (new Date()).toJSON()
//     };
//     db.collection("logs").insert(countLog, (err, result) => {
//         if (err) {
//             console.log(`Log was not recorded! ${err}`);
//             next();
//         }
//         console.log(`Log was recorded`);
//         next();
//     })    
// });

app.get("/", (req, res) => {
    res.send("Hello, is the web page of LightIT test app");
})

app.post("/", (req, res) => {

    db.collection("goods").findOne( { _id: ObjectID(req.body.id) }, 
        (err, doc) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500)
            }
        const currentGoods = {
            date: (new Date()).toJSON(),
            item: doc,
            discount: 0,
            TOTTAL: doc.price,
            status_order: false,
            status_paid: false
        };

        const datePost = currentGoods.date.slice(0,10).split("-");
        const dateGoods = doc.date.slice(0,10).split("-");

        if(datePost[0] >= dateGoods[0] && (datePost[1] - dateGoods[1]) >= 1 && datePost[2] >= dateGoods[2]){
            currentGoods.discount = 0.2;
            currentGoods.TOTTAL = doc.price - (doc.price * currentGoods.discount);
            currentGoods.discount = '20%';
        } 
        db.collection("order-queue").insert(currentGoods, (err, result) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500)
            }
            res.send(`Item was added to order queue`);
        })
    }
    )
})

app.put('/order-queue/:username/:id', (req, res) => {

    const userId = req.body.id;
    const userName = req.params.username;
    const idGoods = req.params.id;

    db.collection("employers").findOne( { _id: ObjectID(userId) }, 
        (err, doc) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500)
            }

        if(userName == doc.username && userId == doc._id) {
            switch (doc.position) {

                case "seller":
                    db.collection('order-queue').update(
                        { _id: ObjectID(idGoods) },
                        {
                            $set: {status_order: true}
                        },
                        {  upsert: false  },
                        (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.sendStatus(500);
                            }
                            res.sendStatus(200);
                        }
                    )
                    break;

                case "cashier":
                    db.collection('order-queue').findOne({ _id: ObjectID(idGoods) },
                        (err, docs) => {
                            if (err) {
                                console.log(err);
                                return res.sendStatus(500);
                            }
                            if(docs.status_order == true) {
                                db.collection('order-queue').updateOne(
                                    { _id: ObjectID(idGoods) },
                                    { 
                                            $set: {
                                                status_paid: true,
                                                check_paid: (new Date()).toJSON()
                                            }
                                    },
                                    {  upsert: false  },
                                    (err, result) => {
                                        if (err) {
                                            console.log(err);
                                        return res.sendStatus(500);
                                    }
                                    res.sendStatus(200);
                                }
                                )
                            } else {
                                res.send(`Current order with id ${docs._id} was not complete!`)
                            }
                        }
                    )
                    break;

                default:
                    res.send('Does not have this user')
            }
        } else {
            res.send(`User with User Name "${userName}" and id "${userId}" was not found!`)
        }
    })
})

app.get("/order-queue/:username/statistics", (req, res) => {

    const userId = req.body.id;
    const userName = req.params.username;

    const statisticDate = [statisticFromDate = req.body.fromDate, statisticToDate = req.body.toDate];
    const filterDate = statisticDate.filter( (el) => {   
            return el != null;
        }
    );
    db.collection('employers').findOne( { _id: ObjectID(userId) },
        (err, doc) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500)
            }

            if(userName == doc.username && userId == doc._id && doc.position == 'accounter')  {
                switch (filterDate.length) {
                    case 2:
                        db.collection('order-queue').find().toArray( (err, doc) => {
                            if(err) {
                                console.log(err);
                                return res.sendStatus(500);
                            }
                            const result = [];
                            const foltredDoc = doc.filter(item => item.date.slice(0,10) >= filterDate[0] && item.date.slice(0,10) <= filterDate[1]);
                            res.send(foltredDoc);
                        })
                        break;
                    
                    case 1:
                        res.send('Failed writted date');
                        break;

                    default:
                        db.collection('order-queue').find().toArray( (err, doc) => {
                            if(err) {
                                console.log(err);
                                return res.sendStatus(500);
                            }
                            const foltredDoc = doc.filter(item => item.date.slice(0,10));
                            res.send(foltredDoc);
                        }
                    )
                }
            } else {
                res.send(`User "${user}" dosen't have access`)
            }
    })        
})


app.get("/logs", (req, res) => {
    db.collection("logs").find().toArray((err, docs) => {
        if (err) {
          console.log(err);
          return res.sendStatus(500);
        }
        console.log(req.body)
        res.send(docs);
    })
})

mongodb.connect(url, (err, client) => {
    db = client.db('light');
    console.log("Connected successfully to server");
    app.listen(3030, () => {
        console.log('Api app works!')
    });
})