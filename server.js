const express    = require("express"),
	  bodyParser = require("body-parser"),
	  exphbs     = require('express3-handlebars'),
	  logger     = require("morgan"),
	  mongoose   = require("mongoose"),
	  app        = express(),
	  PORT       = process.env.PORT || 3000,
	  comment    = require("./models/Comment.js"),
	  article    = require("./models/Article.js"),
	  db         = mongoose.connection;

mongoose.Promise = Promise;

// Express Setup
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

// Express Handlebars Setup
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");


// Database configuration with mongoose
if (process.env.MONGODB_URI)
{
	mongoose.connect(process.env.MONGODB_URI);
}
else {
	mongoose.connect("mongodb://localhost/techcrunch");
}

// Show any mongoose errors
db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
  });
  
  // Once logged in to the db through mongoose, log a success message
  db.once("open", function() {
	console.log("Mongoose connection successful.");
  });

// Routes
require("./controller/routes.js")(app);

app.listen(PORT, function() {
	console.log("App listening on PORT: " + PORT)
});