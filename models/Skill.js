const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
    }
});

module.exports = mongoose.model("Skill", SkillSchema);