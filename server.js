// =========================================================================================
// Dependencies
// =========================================================================================
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 8080;
var app = express();

// =========================================================================================
// Middleware
// =========================================================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/gameInformerHeadlines";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true });

// Use Handlebars
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// =========================================================================================
// Routes
// =========================================================================================
app.get("/", function (req, res) {

   db.Article.find({})
      .then(function(dbArticles) {

         // console.log(dbArticles);

         // Prep object for handlebars
         var articles = {
            articles: dbArticles
         }

         // Render index.handlebars with Game Informer article data
         res.render("index", articles);
      })
      .catch(function(err) {
         console.log("Error: ", err);
      })

})

// Route for scraping all front-page articles if database is empty.
app.get("/scrape", function(req, res) {
   
   db.Article.find({})
   .then(function(dbContent) {
      if(dbContent.length > 0) {
         console.log("You have already scraped all the articles from Game Informer's home page!");
      } else {
         // Request Game Informer site. Scrape all article titles, summaries, authors, and urls.
         request("https://www.gameinformer.com/", function (err, res, body) {
            if (err) {
               console.log("Error: ", error);
            } else {
      
               var $ = cheerio.load(body);
      
               $(".article-summary").each(function (i, element) {
      
                  var articleInfo = {};
      
                  articleInfo.title = $(this)
                     .children(".article-title")
                     .children("a")
                     .text()
                     // Replaces all escape characters ("\n" and "\t") with an empty string
                     .replace(/(\n)/g, "")
                     .replace(/(\t)/g, "");
      
      
                  articleInfo.summary = $(this)
                     .children(".promo-summary")
                     .text();
      
                  articleInfo.author = $(this)
                     .children(".author-details")
                     .children("a")
                     .text();
      
                  articleInfo.url = "https://www.gameinformer.com" + $(this)
                     .children(".article-title")
                     .children("a")
                     .attr("href");
                  
                  db.Article.create(articleInfo)
                     .then(function (dbArticle) {
                        console.log(dbArticle);
                     })
                     .catch(function (err) {
                        console.log(err);
                     });
               });
            }
         })
      }
   })
   .catch(function(err) {
      console.log(err);
   })

})


// =========================================================================================
// Start server
// =========================================================================================
app.listen(PORT, function () {
   console.log("App running on port " + PORT + "!");
});
