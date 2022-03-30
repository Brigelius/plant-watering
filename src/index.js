const express = require('express');
const { ObjectId, Double } = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/plant-watering";

var app = express();
app.use(express.json());


app.post('/', async function(req, res) {

    if (!req.body) {
        res.status(400).send("missing body")
        return "missing body"
    }
    console.log(req.body)

    if (!req.body.deviceId) {
        res.status(400).send("missing deviceId")
        return "missing deviceId"
    }

    if (!req.body.sensorValue) {
        res.status(400).send("missing sensorValue")
        return "missing sensorValue"
    }

    if (!req.body.sensorThreshold && req.body.sensorThreshold != 0) {
        res.status(400).send("missing sensorThreshold")
        return "missing sensorThreshold"
    }

    const plant = await getPlant(req.body.deviceId)
    if (plant) {
        insertMoistData(plant._id, req.body.deviceId, req.body.sensorValue, req.body.sensorThreshold)
        res.status(200).json({
            "_id": plant._id,
            "deviceId": plant.deviceId,
            "sensorThreshold": plant.sensorThreshold,
            "name": plant.name,
        })
        return "Success"
    } else {
        const newPlant = await insertPlant(req.body.deviceId)
        if (newPlant) {

            res.status(200).json({
                "_id": newPlant._id,
                "deviceId": newPlant.deviceId,
                "sensorThreshold": newPlant.sensorThreshold,
                "name": newPlant.name
            })
            return "Success"
        }
    }
    res.status(500).send("Unable to find plant").status(500)

})



function generateName(length) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}



async function getPlant(deviceId) {
    const client = await MongoClient.connect(url)
    const plant = await client.db("plant-watering").collection("plants").findOne({ deviceId })
    console.log("found plant: ", plant);
    return plant
}

async function insertPlant(deviceId) {
    const client = await MongoClient.connect(url)
    const doc = {
        deviceId: deviceId,
        sensorThreshold: new Double(900),
        name: generateName(15),
        createdAt: new Date()
    }
    const newPlant = await client.db("plant-watering").collection("plants").insertOne(doc)
    const plant = await client.db("plant-watering").collection("plants").findOne(newPlant.insertedId)

    return plant
}

async function getMoistData(deviceId) {

    const client = await MongoClient.connect(url)
    const data = await client.db("plant-watering").collection("soilMoist").find({ deviceId }).toArray();
    return data
}
async function insertMoistData(id, deviceId, sensorValue, sensorThreshold) {

    const client = await MongoClient.connect(url)
    const doc = {
        reference: id,
        deviceId,
        sensorValue: new Double(sensorValue),
        sensorThreshold: new Double(sensorThreshold),
        createdAt: new Date()
    }

    client.db("plant-watering").collection("soilMoist").insertOne(doc);

}


var server = app.listen(9090, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})