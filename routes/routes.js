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

    // scrape data then save to mongodb
    app.get('/scrape', (req, res)=>{
        // get body of url
        axios.get('http://www.bbc.com/sport/football')
        .then((response)=>{
            // use cheerio for shorthand selector $
            let $ = cheerio.load(response.data);
            
            $('.lakeside__content').each(function(i, element) {
                let result = {};
                const title = $(this).children('h3').children('a').children('span').text();
                const link = $(this).children('h3').children('a').attr('href');
                const summary = $(this).children('p').text();

                result.title = title;
                result.link = link;
                result.summary = summary;
               
                // create new Article
                db.Article.create(result)
                .then((dbArticle)=>{
                    console.log(`\narticle scraped: ${dbArticle}`);
                })
                .catch((err)=>{
                    console.log(`\nerror while saving to database: ${err}`);
                });
            });

            res.redirect('/articles');
        })
        .catch((error)=>{
            console.log(`error while getting data from url: ${error}`);
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