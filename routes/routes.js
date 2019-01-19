// dependencies
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../models');

module.exports = (app)=>{
    // main page
    app.get('/', (req, res)=>{
        // look for existing articles in database
        db.Article.find({})
        .sort({timestamp: -1})
        .then((dbArticle)=>{
            if (dbArticle.length == 0) {
                // if no articles found, render index
                res.render('index');
            }
            else {
                // if there are existing articles, show articles
                res.redirect('/articles');
            }
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // saved articles page
    app.get('/saved', (req, res)=>{
        db.Article.find({saved: true})
        .then((dbArticle)=>{
            let articleObj = {article: dbArticle};

            // render page with articles found
            res.render('saved', articleObj);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    


    // A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.echojs.com/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
  
      // Now, we grab every h2 within an article tag, and do the following:
      $("article h2").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
  
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(`\narticle scraped: ${dbArticle}`);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
  
      // Send a message to the client
      res.redirect('/articles');
    });
  });

    // show articles after scraping
    app.get('/articles', (req, res)=>{
        db.Article.find({})
        .sort({timestamp: -1})
        .then((dbArticle)=>{
            let articleObj = {article: dbArticle};

            // render page with articles found
            res.render('index', articleObj);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // save article
    app.put('/article/:id', (req, res)=>{
        let id = req.params.id;

        db.Article.findByIdAndUpdate(id, {$set: {saved: true}})
        .then((dbArticle)=>{
            res.json(dbArticle);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // remove article from page 'saved'
    app.put('/article/remove/:id', (req, res)=>{
        let id = req.params.id;

        db.Article.findByIdAndUpdate(id, {$set: {saved: false}})
        .then((dbArticle)=>{
            res.json(dbArticle);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // get current notes
    app.get('/article/:id', (req,res)=>{
        let id = req.params.id;

        // cannot get notes associated with article, only the very first one
        db.Article.findById(id)
        .populate('note')
        .then((dbArticle)=>{
            res.json(dbArticle);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // save new note
    app.post('/note/:id', (req, res)=>{
        let id = req.params.id;

        db.Note.create(req.body)
        .then((dbNote)=>{
            return db.Article.findOneAndUpdate({
                _id: id
            }, {
                $push: {
                    note: dbNote._id
                }
            }, {
                new: true, upsert: true
            });
        })
        .then((dbArticle)=>{
            res.json(dbArticle);
        })
        .catch((err)=>{
            res.json(err);
        });
    });

    // delete note
    app.delete('/note/:id', (req, res)=>{
        let id = req.params.id;
        
        db.Note.remove({_id: id})
        .then((dbNote)=>{
            res.json({message: 'note removed!'});
        })
        .catch((err)=>{
            res.json(err);
        });
    });
};