//jshint esversion:6
require('dotenv').config()
const session = require('express-session');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require('passport');
var findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static(__dirname +"/public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
  
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", );

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    
    res.render("home");
});
app.get("/submit", function(req, res){
     if(req.isAuthenticated()){
    res.render("submit");
   } else{
    res.redirect("/login");
   }
    
});
app.post("/submit", function(req, res){
    const submitSecret = req.body.secret;
    console.log(req.user);
    User.findById(req.user.id, function(err, founduser){
        if(err){
            console.log(err);
        } else{
            if(founduser){
                founduser.secret = submitSecret;
                founduser.save(function(){
                    res.redirect("secrets");
                });
            }
        }
    });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );
  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    
    res.render("login");
});
app.get("/register", function(req, res){
    
    res.render("register");
});

app.get("/secrets", function(req, res){

   User.find({"secret": { $ne: null } }, function(err, founduser){
    if(err){
        console.log(err);
    } else{
        if(founduser){
            res.render("secrets", {foundsecrets: founduser});
        }
    }
   });
});
app.get("/logout", function(req, res){
      req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
//post request on register form 
app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){

        if(err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets")  

            })
        }
    })
   
});
 
app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.logIn(user, function(err){
     
        if(err){
            console.log(err);
        } else{
            passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets")  
            })
        }
    });
   
});









app.listen(3000,function(){
    console.log("server started at port 3000 !!")
});
