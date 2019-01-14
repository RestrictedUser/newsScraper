var mongoose = require('mongoose');

mongoose.connect("mongodb://newUser123:newUser123@ds257314.mlab.com:57314/newsscraper");
var articleSchema = mongoose.Schema({
    headline: String,
    summary: String,
    URL: String 
})
module.exports = mongoose.model("Article", articleSchema);