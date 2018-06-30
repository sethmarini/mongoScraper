
const REQUEST = require('request'),
    	CHEERIO = require("cheerio"),
    	MOMENT  = require("moment"),
	    Article = require("../models/Article.js"),
	    Comment = require("../models/Comment.js");

module.exports = function (app) {

	app.get('/', function (req, res) {

		Article.find()
			.populate("comments")
			.exec(function (err, docs) {

			let hbsObject = {

				article: docs,
				helpers: {
					formatDate: function (date) {
						return MOMENT(date).format("MM/DD/YYYY").toString();
					}
				}
			};

			res.render("index", hbsObject);
		});
	});


	app.get("/api/scrape", function (req, res) {

		console.log("hello");

		REQUEST("https://techcrunch.com/tag/news-feed/", function (error, response, html) {

			var $ = CHEERIO.load(html);

			$('div.post-block--unread').each(function (i, el) {

				let result = {};

					result.title = $(el)
						.find('h2.post-block__title')
						.children('a')
						.text()
						.trim();
					result.link = $(el)
						.find('h2.post-block__title a')
						.attr('href');
					result.date = new Date($(el)
						.find('time')
						.attr('datetime'));
					result.author = $(el).find('span.river-byline__authors')
						.children('a')
						.text();

				let entry = new Article(result);

				console.log(result);

				entry.save(function (err, doc) {

					if (err) {
						console.log(err);
					}
					else {
						console.log(doc);
					}
				});
			});
		});

		setTimeout(function () { res.redirect("/") }, 20000);
	});


	app.get("/api/article", function (req, res) {

		Article.find({}, function (error, doc) {

			if (error) {
				console.log(error);
			}
			else {
				res.json(doc);
			}
		});
	});


	app.get("api/article/:id", function (req, res) {

		Article.findOne({ "_id": req.params.id })
			.populate("comments")
			.exec(function (error, doc) {

				if (error) {
					console.log(error);
				}
				else {
					res.json(doc);
				}
			});
	});


	app.post("/api/article/:id", function (req, res) {
	
		var newComment = new Comment(req.body);

		newComment.save(function (error, doc) {

			if (error) {
				console.log(error);
			}
			else {
				Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "comments": doc._id } }, { new: true })
					.exec(function (err, doc) {

						if (err) {
							console.log(err);
						}
						else {
							res.redirect('/');
						}
					});
			}
		});
	});


	app.post("/api/delete-comment", function (req, res) {

		let commentID = req.body.commentID;
		let articleID = req.body.articleID;

		Comment.remove({ "_id": commentID }, function (error, doc) {

			if (error) {
				console.log(error);
			}

			else {

				Article.findOneAndUpdate({ "_id": articleID }, { $pull: { "comments": commentID } }, { new: true })
					.exec(function (err, doc) {

						if (err) {
							console.log(err);
						}
						else {
							res.json({ complete: true });
						}
					});
			}
		});
	});

//END module.exports
};