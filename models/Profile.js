const mongoose = require("mongoose");
require('mongoose-type-url');

const ProfileSchema = new mongoose.Schema({
    headline: {
        type: String,
        maxlength: 100,
        default: ''
    },
    phone: {
        type: Number,
    },
    website: {
        type: mongoose.SchemaTypes.Url,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        maxlength: 500,
        default: ''
    },
    skills: [{
        type: String,
        maxlength: 50
    }],
    links: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Link"
    }],
    resume: {
        type: String,
    },
    isResumePublic: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Profile", ProfileSchema);