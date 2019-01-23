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
app.get("/", function(req, res) {
   // test to see if server is up and running
   res.send("Hello world!");
})


// =========================================================================================
// Start server
// =========================================================================================
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
