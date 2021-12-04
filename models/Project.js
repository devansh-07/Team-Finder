const mongoose = require("mongoose");
require('mongoose-type-url');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 50,
    },
    description: {
        type: String,
        maxlength: 800,
        required: true
    },
    liveUrl: {
        type: mongoose.SchemaTypes.Url
    },
    codeUrl: {
        type: mongoose.SchemaTypes.Url
    },
    technologies: [{
        type: String
    }],
    contributors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
    }
});

module.exports = mongoose.model("Project", ProjectSchema);