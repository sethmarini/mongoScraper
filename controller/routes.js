
const REQUEST = require('request'),
      CHEERIO = require("cheerio"),
	    MOMENT  = require("moment"),
			Article = require("../models/Article.js"),
			Comment = require("../models/Comment.js");


module.exports = function(app){

	app.get('/', function(req, res){
		
		Article.find()
		.populate("comments")
		.exec(function(err, docs){

			let hbsObject ={
				article: docs,
				helpers: {
            		formatDate: function (date) { 
            			return MOMENT(date).format("MM/DD/YYYY").toString(); 
            		}
        		}
			};

			res.render("index", hbsObject);
		})
		
	});

	//Scrape articles from web and stores them in mongodb
	app.get("/api/scrape", function(req, res) {
	console.log("hello")
	  // First, we grab the body of the html with request
	  REQUEST("https://techcrunch.com/tag/news-feed/", function(error, response, html) {
	    
	    // Then, we load that into cheerio and save it to $ for a shorthand selector
			var $ = CHEERIO.load(html);

	    $('div.post-block--unread').each(function(i, el){

	    	//Save an empty result object
	    	let result ={};

	    	// Add the title and href of every link, and save them as properties of the result object
      		result.title = $(el).find('h2.post-block__title').children('a').text().replace(/\t\t\t\n\t\t\t\t/g, ",").trim();
      		result.link = $(el).find('h2.post-block__title a').attr('href');
      		result.date = new Date($(el).find('time').attr('datetime'))
      		result.author = $(el).find('span.river-byline__authors').children('a').text().replace(/\t\t\t\n\t\t\t\t/g, ",").replace(/\n\t\t\t\t/g, "").replace(/\t\t\t/g, "");
    	
	      	// Using our Article model, create a new entry 
	      	// This effectively passes the result object to the entry (and the title and link)
	      	let entry = new Article(result);
					
					console.log(result);

	      	// Save that entry to the db
	      	entry.save(function(err, doc) {
	        	// Log any errors
	        	if (err) {
	          		console.log(err);
	          		
	        	}
	        	// Or log the doc
	        	else {	        	
	          		console.log(doc);
	        	}
	      	});
	    });	   
	  });
	  // Tell the browser that we finished scraping the text
	 	  setTimeout(function() {res.redirect("/")}, 20000);
	});


	// This will get all articles we scraped from the mongoDB
	app.get("/api/article", function(req, res) {
	  // Grab every doc in the Articles array
	  Article.find({}, function(error, doc) {
	    // Log any errors
	    if (error) {
	      console.log(error);
	    }
	    // Or send the doc to the browser as a json object
	    else {
	      res.json(doc);
	    }
	  });
	});

	// Gets a single article and populates it with it's comments
	app.get("api/article/:id", function(req, res) {
	  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	  Article.findOne({ "_id": req.params.id })
	  // ..and populate all of the notes associated with it
	  .populate("comments")
	  // now, execute our query
	  .exec(function(error, doc) {
	    // Log any errors
	    if (error) {
	      console.log(error);
	    }
	    // Otherwise, send the doc to the browser as a json object
	    else {
	      res.json(doc);
	    }
	  });
	});


	// Create a new Comment
	app.post("/api/article/:id", function(req, res) {
	 	
	  // Create a new note and pass the req.body to the entry
	  var newComment = new Comment(req.body);

	  // And save the new note the db
	  newComment.save(function(error, doc) {
	    // Log any errors
	    if (error) {
	      console.log(error);
	    }
	    // Otherwise
	    else {     		
	      // Use the article id to find and update it's note
	      Article.findOneAndUpdate({ "_id": req.params.id }, {$push:{ "comments": doc._id }},  { new: true })
	      // Execute the above query
	      .exec(function(err, doc) {
	        // Log any errors
	        if (err) {
	          console.log(err);
	        }
	        else {
	          // Or send the document to the browser
	          res.redirect('/');
	        }
	      });
	    }
	  });
	});

	
	// removes a comment from 'Comments' and 'Article' collections.
	app.post("/api/delete-comment", function(req, res){

		let commentID = req.body.commentID;
		let	articleID = req.body.articleID;
		
		Comment.remove({"_id": commentID}, function(error, doc) {
	    // Log any errors
	    if (error) 
	    {
	      console.log(error);
	    }
	    // Otherwise
	    else 
	    {     		
	      // Use the article id to find and update it's note
	      Article.findOneAndUpdate({ "_id": articleID }, {$pull:{ "comments": commentID }},  { new: true })
	      // Execute the above query
	      .exec(function(err, doc) {
	        // Log any errors
	        if (err) {
	          console.log(err);
	        }
	        else {
	          // Or send the document to the browser
	          res.json({complete:true});
	        }
	      });
	    }
	  });
	});

}//END module.exports