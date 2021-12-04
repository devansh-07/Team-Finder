const mongoose = require("mongoose");
const config = require("../config");
require('mongoose-type-url');

const PLATFORM_CHOICES = config.PLATFORM_CHOICES;

const LinkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: PLATFORM_CHOICES,
        required: true
    },
    url: {
        type: mongoose.SchemaTypes.Url,
        required: true
    },
    icon: {
        type: String,
    }
});

module.exports = mongoose.model("Link", LinkSchema);