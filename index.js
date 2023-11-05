const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.POST || 5000
require('dotenv').config()
app.use(express.json())
app.use(cors())





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.zoyeiku.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const CategoryshopCollection = client.db("BlogDB").collection("category");
        const BlogCollection = client.db("BlogDB").collection("blogs");


        // category section
        app.get('/category', async(req, res) =>{
            const cursor = CategoryshopCollection.find().limit(3)
            const result = await cursor.toArray()
            res.send(result)
        })

        // blogs section 

        app.post('/add-blog', async(req, res) =>{
            const blogData = req.body
            const result = await BlogCollection.insertOne(blogData)
            res.send(result)
        })

        app.get('/recent-blog', async(req, res) =>{
            const RecentBlog = BlogCollection.find().sort({CurrentTime: -1}).limit(6)
            const result = await RecentBlog.toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello world')
})

app.listen(port, () => {
    console.log('My Server Runing On Port', port)
})