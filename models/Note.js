const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema
const NoteSchema = new Schema({
    body: {
        type: String
    }
});

// Create model from schema
const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;