const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.POST || 5000
require('dotenv').config()
app.use(express.json())
app.use(cors())





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const WishListCOllection = client.db("BlogDB").collection("wishlist");


        // category section
        app.get('/category', async(req, res) =>{
            const cursor = CategoryshopCollection.find().limit(3)
            const result = await cursor.toArray()
            res.send(result)
        })


        app.get('/categorys', async(req, res) =>{
            const cursor = CategoryshopCollection.find()
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
            const RecentBlog = await BlogCollection.find().sort({CurrentTime: -1}).limit(6).toArray()
            // const result = await RecentBlog.toArray()
            // console.log(result)
            res.send(RecentBlog)
        })
        app.get('/all-blog', async(req, res) =>{
            let quary = {}
            const cat = req.query.category
            console.log('Hello Bangladesh')
            console.log(cat)
            const title = req.query?.title
            console.log(title)
            // console.log(req.query.category)
            if(cat || title){
                if(cat){
                    quary = {Category: cat}
                }
                if(title){

                    quary = {title: title}
                }
            }

            app.get('/single-blog/:id', async(req, res) =>{
                const Id = req.params.id
                const quary = {_id: new ObjectId(Id)}
                const result = await BlogCollection.findOne(quary)
                res.send(result)
            })
            const RecentBlog = await BlogCollection.find(quary).toArray()
                       
            // const result = await RecentBlog.toArray()
            // console.log(result)
            res.send(RecentBlog)
        })

        // wishList section
        app.post('/addToWishlist', async(req, res) =>{
            const wishlistData = req.body
            const result = await WishListCOllection.insertOne(wishlistData)
            res.send(result)
        })

        app.get('/wishlists/:email', async(req, res) =>{
            const email = req.params.email
            const quary = {email: email}
            const result = await WishListCOllection.find(quary).toArray()
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