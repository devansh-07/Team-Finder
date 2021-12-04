const mongoose = require("mongoose");

const InviteSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    message: {
        type: String,
        maxlength: 500,
        default: ""
    },
    status: {
        type: String,
        enum: ["accepted", "rejected", "pending", "cancelled"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date,
    }
});

module.exports = mongoose.model("Invite", InviteSchema);