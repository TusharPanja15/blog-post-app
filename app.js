const express = require('express')
const https = require('https')
const ejs = require('ejs')
const _ = require('lodash')
const mongoose = require('mongoose')
const fs = require('fs')
const methodOverride = require('method-override')

const app = express()

const quote = "The way to get started is to quit talking and begin doing"
const quotePerson = "Walt Disney"
const about = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"
const contact = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"

app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(methodOverride('_method'))


mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true, useUnifiedTopology: true })

const postsSchema = {
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}

const Post = mongoose.model("Post", postsSchema)

const post1 = new Post({
    title: "Welcome",
    category: "",
    content: ""
})

const defaultPosts = [post1]

app.get('/', (req, res) => {

    const today = new Date()
    const options = { day: "numeric", month: "long" }
    const day = today.toLocaleDateString("en-US", options)

    Post.find({}, (err, posts) => {
        if (posts.length === 0) {
            Item.insertMany(defaultPosts, function (err) {
                if (err) {
                    console.log(err)
                }
            })
            res.redirect('/')
        } else {
            res.render("home", { posts: posts, day: day, quote: quote, quotePerson: quotePerson })
        }
    }).sort({ createdAt: 'desc' })
})


app.route('/compose')

    .get((req, res) => {
        res.render("compose")
    })

    .post((req, res) => {
        const post = new Post({
            title: req.body.postTitle,
            category: req.body.postCategory,
            content: req.body.postBody
        })

        post.save((err) => {
            if (!err) {
                res.redirect("/");
            }
        })
    })

app.get('/posts/:postId', (req, res) => {

    const requestedPostId = req.params.postId

    Post.findOne({ _id: requestedPostId }, (err, post) => {
        res.render("post", {
            title: post.title,
            category: post.category,
            content: post.content,
            createdAt: post.createdAt,
            post_ID: post._id
        })
    })
})


app.route('/posts/edit/:postId')

    .get((req, res) => {

        const editPostId = req.params.postId

        Post.findOne({ _id: editPostId }, (err, post) => {
            res.render("edit", {
                title: post.title,
                category: post.category,
                content: post.content,
                createdAt: post.createdAt,
                post_ID: post._id
            })
        })
    })

app.post('/deletePost', (req, res) => {
    const deletePostId = req.body.deletePost

    Post.findByIdAndRemove(deletePostId, (err) => {
        if (!err) {
            console.log("success")
            res.redirect('/')
        }
    })
})

app.get('/contact', (req, res) => {
    res.render("contact", { contactUsText: contact })
})

app.get('/about', (req, res) => {
    res.render("about", { aboutUsText: about })
})

const port = process.env.PORT || 4000
app.listen(port, function () {
    console.log(`Listening on port ${port} ...`)
})