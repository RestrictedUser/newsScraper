var express = require("express");
var Article = require("./models/Article");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

var app = express();
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.get("/all", function(req, res){
    Article.find().then(function(data){
       res.send(data); 
    });
});

app.get("/", function(req, res){
    Article.find().then(function(data){
       res.render("index", {data: data}); 
    });
});




// route to make comments


//route to delete comments




app.get("/scrape", function(req, res){
    axios.get("https://www.nytimes.com/").then(function(response){
      var $ = cheerio.load(response.data);
      $('.css-8atqhb').each(function(i, element){
        var headline = $(this).children('div').children('a').text();
        var summary = $(this).children("div").children('a').text();
        var URL = $(this).children("div").children('a').attr("href");
        console.log(headline);
        console.log(URL);
        if(headline && URL){
            Article.create({
                headline: headline,
                summary: summary,
                URL: URL
            })
        }
      });
    });
    res.send("scrape complete");
  });


app.listen(3000)