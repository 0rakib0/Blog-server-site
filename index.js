const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.POST || 5000
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');



app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))


const looged = (req, res, next) => {
    console.log('Logged Info Here>>>>>>>>>>-----', req.method, req.url)
    next()
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token
    if (!token) {
        return res.status(401).send({ message: 'Unautorize Access' })
    }
    jwt.verify(token, process.env.SECRET_TOKEN_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unautorize Access' })
        }
        req.user = decoded;
        next()
    })
}



app.use(cookieParser())




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
        const CommentCOllection = client.db("BlogDB").collection("Comment");
        const NewsLater = client.db("BlogDB").collection("NewsLatter");

        // JWT Token Section
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN_KEY, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send(token)
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ sucess: true })
        })

        // category section
        app.get('/category', async(req, res) =>{
            const cursor = CategoryshopCollection.find().limit(3)
            const result = await cursor.toArray()
            res.send(result)
        })


        app.get('/allcategorys', async(req, res) =>{
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

        app.put('/updateBlog/:id', async (req, res) =>{
            const Id = req.params.id
            const UpdatedData = req.body
            console.log(UpdatedData)
            const filter = { _id: new ObjectId(Id) }
            const options = { upsert: true }
            const updateBlog = {
                $set: {
                    title: UpdatedData.title,
                    blogPpic: UpdatedData.blogPpic,
                    Category: UpdatedData.Category,
                    shorDes: UpdatedData.shorDes,
                    details: UpdatedData.details
                }
            }
            const result = await BlogCollection.updateOne(filter, updateBlog, options)
            res.send(result)
        })

        app.get('/recent-blog', async(req, res) =>{
            const RecentBlog = await BlogCollection.find().sort({CurrentTime: -1}).limit(6).toArray()
            res.send(RecentBlog)
        })
        app.get('/all-blog', async(req, res) =>{
            let quary = {}
            const cat = req.query.category
            const title = req.query?.title
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

        app.get('/sort-Blog', async(req, res) =>{
            const cursor = BlogCollection.find()
            const result = await cursor.limit(10).toArray()
            const SortData = result.sort((a, b) => a.details.length - b.details.length).reverse()
            // console.log(result)
            res.send(SortData)
        })

        // wishList section
        app.post('/addToWishlist', async(req, res) =>{
            const wishlistData = req.body
            const result = await WishListCOllection.insertOne(wishlistData)
            res.send(result)
        })

        app.get('/wishlists/:email', verifyToken, async(req, res) =>{
            const email = req.params.email
            const CookieUser = req.user.email
            if (email !== CookieUser) {
                return res.status(403).send({ message: 'Access Forbidden' })
            }
            const quary = {email: email}
            const result = await WishListCOllection.find(quary).toArray()
            res.send(result)
        })

        app.delete('/deleteWishlist/:id', async(req, res) =>{
            const Id = req.params.id
            const quary = {_id: new ObjectId(Id)}
            const result = await WishListCOllection.deleteOne(quary)
            res.send(result)
        })

        app.post('/comment', async(req, res) =>{
            const Comment = req.body
            const result = await CommentCOllection.insertOne(Comment)
            res.send(result)
        })

        app.get('/comment/:id', async(req, res) =>{
            const Id = req.params.id
            const quary = {blogId: Id}
            const result = await CommentCOllection.find(quary).toArray()
            res.send(result)
        })

        app.get('/comment', async(req, res) =>{
            const result = await CommentCOllection.find().limit(5).toArray()
            res.send(result)
        })

        app.post('/newslatter', async(req, res) =>{
            const User = req.body
            const result = await NewsLater.insertOne(User)
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