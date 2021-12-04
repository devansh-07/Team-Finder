const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    socialId: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        maxlength: 50,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    image: {
        type: String
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    }],
});

module.exports = mongoose.model("User", UserSchema);