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

// Root route to load index.handlebars with any artlces in database
app.get("/", function (req, res) {

   db.Article.find({ saved: false })
      .then(function (dbArticles) {

         // console.log(dbArticles);

         // Prep object for handlebars
         var articles = {
            articles: dbArticles
         }

         // Render index.handlebars with Game Informer article data
         res.render("index", articles);
      })
      .catch(function (err) {
         console.log("Error: ", err);
      })

})

// Route for scraping all front-page articles if database is empty
app.get("/scrape", function (req, res) {

   db.Article.find({})
      .then(function (dbContent) {
         if (dbContent.length > 0) {
            console.log("You have already scraped all the articles from Game Informer's home page!");
         } else {
            // Request Game Informer site. Scrape all article titles, summaries, authors, and urls.
            request("https://www.gameinformer.com/", function (err, response, body) {
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
                           // console.log(dbArticle);
                        })
                        .catch(function (err) {
                           console.log(err);
                        });
                  });
               }

               res.send("scrape complete!");
            })
         }
      })
      .catch(function (err) {
         console.log(err);
      })

})

// Route for deleting all articles from database
app.get("/deleteArticles", function (req, res) {
   db.Article.deleteMany({})
      .then(function (result) {
         console.log("Articles deleted!");
         res.json(result);
      })
      .catch(function (err) {
         console.log(err);
      })
})

// Route for updating a specific article, marking it as saved when "Save Article" button is clicked
app.put("/saveArticle/:id", function (req, res) {

   db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { saved: true } })
      .then(function (dbArticle) {
         res.json(dbArticle);
      })
      .catch(function (err) {
         console.log(err);
      })

})

// Route for rendering the "View Saved Articles" page
app.get("/savedArticles", function (req, res) {

   db.Article.find({ saved: true })
      .then(function (dbArticles) {

         var articles = {
            articles: dbArticles
         }

         res.render("saved", articles);
      })
      .catch(function (err) {
         console.log(err);
      })

})

// Route for 'unsaving' articles
app.put("/unsaveArticle/:id", function (req, res) {

   db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { saved: false } })
      .then(function (dbArticle) {
         res.json(dbArticle);
      })
      .catch(function (err) {
         console.log(err);
      })

})

// Route for creating a new note
app.post("/newNote/:id", function (req, res) {
   console.log(req.params.id);
   console.log(req.body);

   // Create a new note using the req.body
   db.Note.create(req.body)
      .then(function (dbNote) {
         return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
      })
      .then(function (dbArticle) {
         res.json(dbArticle);
      })
      .catch(function (err) {
         res.json(err);
      });
})

app.get("/article/:id/notes", function (req, res) {
   console.log(req.params.id);

   db.Article.findOne({ _id: req.params.id })
      .populate("notes")
      .then(function (dbArticle) {
         res.json(dbArticle);
      })
      .catch(function (err) {
         res.json(err);
      });
})

// =========================================================================================
// Start server
// =========================================================================================
app.listen(PORT, function () {
   console.log("App running on port " + PORT + "!");
});
