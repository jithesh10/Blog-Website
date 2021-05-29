require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const methodoverride=require("method-override");
const passportLocalMongoose = require("passport-local-mongoose");
const url = 'mongodb+srv://admin-jithesh:test123@cluster0.5vnsl.mongodb.net/userDB?retryWrites=true&w=majority';
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Welcome to Blogs.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodoverride("_method"));

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const userSchema = new mongoose.Schema({
   username: {type:String,unique:true},
   password: String, 
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

const blogSchema=new mongoose.Schema({
    title:String,
    content:String,
    author:{id:{type:mongoose.Schema.Types.ObjectId,ref:"User"},username:String}
});

const Blog=new mongoose.model("Blog", blogSchema);
var isloggedin=function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        res.redirect('/login');
    }
}

app.get("/submit",function(req,res){
    res.render("submit");
});

app.get("/home",function(req,res){
    console.log(req.user);
    var auth = 0;
    if(req.isAuthenticated()){
        auth = 1;
    }
    res.render("home", {authenticated : auth});
});

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",passport.authenticate("local",{successRedirect:'/home',failureRedirect:'/login'}),function(req,res){
});

app.get("/blog",isloggedin,function(req,res){

    res.redirect('/index');
});

app.get("/register", function(req,res){
    res.render("signup");
});

app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home");
            });
        }
    });
});

app.get("/index",isloggedin,function(req,res){
    Blog.find({},function(err,blogs){
        if(err)
            console.log(err);
        else{
            res.render("index",{blogs:blogs});
        }
    })
});

app.get("/blog/:id",isloggedin,function(req,res){
    var username = req.user.username;
    Blog.findById(req.params.id,function(err,blog){
        if(err)
            console.log(err);
        else{
            res.render("show",{blog:blog, username: username});
        }
    })
});

app.delete("/blog/:id",isloggedin,function(req,res){
    Blog.findByIdAndDelete(req.params.id,function(err,blog){
        if(err)
            console.log(err);
        else{
            res.redirect("/index");
        }
    })
});

app.post("/blog",isloggedin,function(req,res){
    blog=req.body.blog;
    console.log(blog);
    Blog.create(blog,function(err,blog){
        if(err)
            res.send("Database Error");
        else{
            blog.author={id:req.user.id,username:req.user.username};
            blog.save(function(){
                res.redirect('/index');
            })
        }
    });
});

app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/login");
});

app.listen(process.env.PORT||3000, function(){
    console.log("Server started at port 3000");
});
