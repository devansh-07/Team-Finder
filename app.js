// https://teamforhack.herokuapp.com/

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const session = require("express-session");
const env = require("dotenv");
const expressLayouts = require("express-ejs-layouts");
const passport = require("./oauth");
const flash = require('connect-flash');
const methodOverride = require("method-override");

// Load Config File
env.config({path: "./config/config.env"});

const app = express();

app.use(morgan('dev'));
app.set("view engine", "ejs");
app.set("layout", "layouts/main");
app.use(express.static(__dirname + "/public"));
app.use(expressLayouts);
app.use(express.urlencoded({ extended: false }));

// Method Override (for put requests)
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

// app.use(express.json());
app.use(flash());

// Express Session
app.use(session({
    secret: "my_Secret_key",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// DB
mongoose.connect(process.env.DATABASE_URI)
    .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}.`)
    })
    .catch((err) => {
        console.error(err);
    }
);

// if (process.env.NODE_ENV === "dev") { app.use(morgan('dev')); }

// Auth Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));

app.listen(process.env.PORT || 8000, () => {
    console.log(`Listening on Port ${process.env.PORT}`);
});