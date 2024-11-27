const express = require('express')
const app = express()
// parse the request parameters
app.use(express.json())
// connect to MongoDB
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect('mongodb+srv://ameeraharis369:pac30nov@cluster0.kyxtfvq.mongodb.net', (err, client) => {
    db = client.db('webstore')
})
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
});

app.get('/collection/lessons', async (req, res, next) => {
    try {
        // Query the 'lessons' collection for all documents
        const lessons = await db.collection('lessons').find().toArray();
        res.json(lessons); // Send the lessons as a JSON response
    } catch (error) {
        console.error('Error retrieving lessons:', error);
        res.status(500).send('Error retrieving lessons');
    }
});

app.post('/collection/checkout', (req, res, next) => {
    const checkoutData = req.body;

    // Insert the posted data into the collection
    db.collection("checkout").insertOne(checkoutData, (err, result) => {
        if (err) return next(err);

        // Respond with the inserted document
        res.status(201).send(result.ops[0]); // `ops` contains the inserted document(s)
    });
});


const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Express.js server running at localhost 3000')
})