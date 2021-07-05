const express = require('express')
const https = require('https')
const ejs = require('ejs')
const _ = require('lodash')
const mongoose = require('mongoose')
const fs = require('fs')
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express()

app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(methodOverride('_method'))
app.use(session({
    secret: "sec",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated()
    next()
})

const quote = "The way to get started is to quit talking and begin doing"
const quotePerson = "Walt Disney"
const about = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"
const contact = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"


// ||||||||||||||||||||||||||||||||||| Setting up mongoDB database server, creating schema and model using mongoose ||||||||||||||||||||||||||||||||||||| \\

mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set("useCreateIndex", true);

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
    },
    creator: {
        type: String
    }
}

const userSchema = new mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
})

userSchema.plugin(passportLocalMongoose)

const Post = mongoose.model("Post", postsSchema)
const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| User authentication |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| \\

app.route('/signup')

    .get((req, res) => {
        res.render('signup')
    })

    .post((req, res) => {

        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (!err) {
                passport.authenticate("local")(req, res, function () {
                    res.redirect('/compose')
                })
            } else {
                console.log(err)
            }
        })
    })


app.route('/login')

    .get((req, res) => {
        res.render('login')
    })

    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/compose");
                })
            }
        })
    })


app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})


// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||  Renders Home Page |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| \\

app.get('/', (req, res) => {

    const today = new Date()
    const options = { weekday: 'long', day: "numeric", month: "long" }
    const day = today.toLocaleDateString("en-US", options)

    if (req.isAuthenticated()) {
        req.user.session = req.session
    } else {
        console.log("no")
    }

    Post.find({}, (err, posts) => {
        res.render("home", { posts: posts, day: day, quote: quote, quotePerson: quotePerson })
    }).sort({ createdAt: 'desc' })

})


// ||||||||||||||||||||||||||||||||||||||||||||||||||||| Renders Compose Page and Adds post to database  |||||||||||||||||||||||||||||||||||||||||||||||| \\

app.route('/compose')

    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("compose", { name: req.user.username })
        } else {
            res.redirect('/login')
        }
    })

    .post((req, res) => {
        const post = new Post({
            title: req.body.postTitle,
            category: req.body.postCategory,
            content: req.body.postBody,
            creator: req.user.username
        })

        post.save((err) => {
            if (!err) {
                res.redirect('/');
            }
        })
    })


// ||||||||||||||||||||||| Renders the full blog post Reading using GET method and Updates the post using PUT method by it's ID |||||||||||||||||||||||| \\

app.route('/posts/:postId')

    .get((req, res) => {
        const requestedPostId = req.params.postId

        Post.findOne({ _id: requestedPostId }, (err, post) => {
            res.render("post", {
                title: post.title,
                category: post.category,
                content: post.content,
                createdAt: post.createdAt,
                creator: post.creator,
                post_ID: post._id
            })
        })
    })

    .put((req, res) => {
        var editPostId = req.params.postId

        Post.findByIdAndUpdate(editPostId, { title: req.body.postTitle, category: req.body.postCategory, content: req.body.postBody },
            function (err, post) {
                if (!err) {
                    res.redirect(`/posts/${editPostId}`)
                }
            });
    })


// |||||||||||||||||||||||||||||||||| Renders the full blog post reading on form using GET method by it's ID ||||||||||||||||||||||||||||||||||||||||||| \\

app.get('/posts/edit/:postId', (req, res) => {
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


// |||||||||||||||||||||||||||||||||||||||||||||||| Deletes the post from database using POST method ||||||||||||||||||||||||||||||||||||||||||||||||| \\

app.post('/deletePost', (req, res) => {
    const deletePostId = req.body.deletePost

    Post.findByIdAndDelete(deletePostId, (err) => {
        if (!err) {
            console.log("success")
            res.redirect('/')
        }
    })
})


// ||||||||||||||||||||||||||||||||||||||||||||||||||| Other pages are rendered using GET method ||||||||||||||||||||||||||||||||||||||||||||||||||||| \\

app.get('/contact', (req, res) => {
    res.render("contact", { contactUsText: contact })
})

app.get('/about', (req, res) => {
    res.render("about", { aboutUsText: about })
})


// ||||||||||||||||||||||||||||| Assigns port number manually or automatically from the local enviornment of server |||||||||||||||||||||||||||||||||| \\

const port = process.env.PORT || 4000
app.listen(port, function () {
    console.log(`Listening on port ${port} ...`)
})