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
//CORS MIDDLEWARE
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
// Logger Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString(); // Get current timestamp
    console.log(`[${timestamp}] ${req.method} request to ${req.url}`);
    next(); // Move to the next middleware or route
});

const path = require('path');
const fs = require('fs');

// Static File Middleware
app.use('/images', (req, res) => {
    const imagePath = path.join(__dirname, '../frontend/images', req.path); // Construct image file path

    fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`Image not found: ${imagePath}`); // Log error if file doesn't exist
            res.status(404).send({ msg: 'Image file does not exist' });
        } else {
            res.sendFile(imagePath); // Serve the image file
        }
    });
});

// Query the 'lessons' collection for all documents
app.get('/collection/lessons', async (req, res, next) => {
    try {  
        const lessons = await db.collection('lessons').find().toArray();
        res.json(lessons); // Send the lessons as a JSON response
        console.log('Successfully sent the lessons as a JSON response');
    } catch (error) {
        console.error('Error retrieving lessons:', error);
        res.status(500).send('Error retrieving lessons');
    }
});
//posting the checkout details to database
app.post('/collection/checkout', (req, res, next) => {
    const checkoutData = req.body;

    // Insert the posted data into the collection
    db.collection("checkout").insertOne(checkoutData, (err, result) => {
        if (err) return next(err);

        // Respond with the inserted document
        res.status(201).send(result.ops[0]); // `ops` contains the inserted document
        console.log('Successfully inserted the user details in the database. ');
    });
});
//put- updating the available spaces
const { ObjectId } = require('mongodb'); 

app.put('/collection/lessons/:_id', (req, res, next) => {
    
    const id = req.params._id; //getting the id from url
    const updateData = req.body;
    console.log("Received ID:", req.params._id);
    console.log("Received Data:", req.body);
    if (!ObjectId.isValid(id)) {
        return res.status(400).send({ msg: 'Invalid ID format' });
    }

    db.collection('lessons').updateOne(
        { _id: new ObjectId(id) }, 
        { $set: updateData },
        { safe: true, multi: false },
        (err, result) => {
            if (err) return next(err);
            if (result.matchedCount === 0) {
                return res.status(404).send({ msg: 'Document not found' });
            }
            res.send({ msg: 'Update successful', updatedCount: result.modifiedCount });
        }
    );
});


// Search Route
app.get('/collection/search', (req, res) => {
    const query = req.query.q; // Get search query from the request
    if (!query) {
        return res.status(400).send({ msg: 'Search query is required' });

    }

    // Define the search criteria (case-insensitive search on `subject` or `description`)
    const searchCriteria = {
        $or: [
            { subject: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } }
        ]
    };

    // Fetch matching results from the `lessons` collection
    db.collection('lessons')
        .find(searchCriteria)
        .toArray((err, results) => {
            if (err) {
                return res.status(500).send({ msg: 'Error fetching results', error: err });
            }
            res.send(results);
        });
});

//listening in port 3000
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Express.js server running at localhost 3000')
})