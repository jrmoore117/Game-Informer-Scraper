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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// =========================================================================================
// Routes
// =========================================================================================
app.get("/", function (req, res) {

   // Request Game Informer site. Scrape all article titles.
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
            
            console.log(articleInfo);
         });
      }
   })

})


// =========================================================================================
// Start server
// =========================================================================================
app.listen(PORT, function () {
   console.log("App running on port " + PORT + "!");
});
