//jshint esversion:6
require('dotenv').config()
const bcrypt = require('bcrypt');
const saltRounds = 10;

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");



const app = express();

app.use(express.static(__dirname +"/public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", );

const userSchema = new mongoose.Schema({
    email: String,
    password: String

});

console.log(process.env.API_KEY);


const User = new mongoose.model("user", userSchema);

app.get("/", function(req, res){
    
    res.render("home");
});
app.get("/login", function(req, res){
    
    res.render("login");
});
app.get("/register", function(req, res){
    
    res.render("register");
});
//post request on register form 
app.post("/register", function(req, res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
const newuser = new User({
        email: req.body.username ,
    password: hash

    });
      newuser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
      });
});
 
});


app.post("/login", function(req, res){
    const username = req.body.username ;
    const password = req.body.password;
    
    User.findOne({email: username}, function(err, founduser){
        if(err){
            console.log(err);
        }else{
            if(founduser){
                bcrypt.compare(password, founduser.password, function(err, result) {
    if( result == true){
          res.render("secrets");
    }
});
               
            }else{
                res.send("login password is not correct plz check your passwod")
            };
        };
    });
});









app.listen(3000,function(){
    console.log("server started at port 3000 !!")
});
