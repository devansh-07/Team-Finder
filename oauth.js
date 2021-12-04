const passport = require("passport");
const env = require("dotenv");
const User = require("./models/User");
const Profile = require("./models/Profile");
const random = require("./utils").random;

env.config({path: "./config/config.env"});

// Google Auth using Passport js
var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    async (accessToken, refreshToken, profile, callback_fn) => {
        try {
            let scuser = await User.findOne({ socialId: "google"+profile.id });
            let emluser = await User.findOne({ email: profile.emails[0].value });
            
            if (scuser) {
                callback_fn(null, scuser);
            } else if (emluser) {
                callback_fn(null, emluser);
            } else {
                let email = profile.emails[0].value;
                let head = email.split("@")[0];
                const uname = head + "-" + random();
                
                Profile.create({})
                    .then((userProfile) => {
                        const newUser = {
                            socialId: "google" + profile.id,
                            name: profile.name.givenName + " " + profile.name.familyName,
                            username: uname,
                            email: profile.emails[0].value,
                            image: profile.photos[0].value.replace("s96-c", "s240-c"),
                            profile: userProfile._id
                        };

                        return User.create(newUser);
                    })
                    .then((user) => {
                        callback_fn(null, user);
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }
        } catch (err) {
            console.error(err);
        }
    }
));


// Github Auth 
var GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback"
    },
    async (accessToken, refreshToken, profile, callback_fn) => {
        try {
            let scuser = await User.findOne({ socialId: "github"+profile.id });
            let emluser = await User.findOne({ email: profile.emails[0].value });
            
            if (scuser) {
                callback_fn(null, scuser);
            } else if (emluser) {
                callback_fn(null, emluser);
            } else {
                let email = profile.emails[0].value;
                let head = email.split("@")[0];
                const uname = head + "-" + random();

                console.log(uname);
                
                Profile.create({})
                    .then((userProfile) => {
                        const newUser = {
                            socialId: "github"+profile.id,
                            name: profile.displayName,
                            username: uname,
                            email: profile.emails[0].value,
                            image: profile.photos[0].value,
                            profile: userProfile._id
                        }
                        
                        return User.create(newUser);
                    })
                    .then((user) => {
                        callback_fn(null, user);
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }
        } catch (err) {
            console.error(err);
        }
    }
));

var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(new LinkedInStrategy({
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "/auth/linkedin/callback",
        scope: ['r_emailaddress', 'r_liteprofile'],
        state: true,
    }, 
    async (accessToken, refreshToken, profile, callback_fn) => {
        try {
            let scuser = await User.findOne({ socialId: "linkedin"+profile.id });
            let emluser = await User.findOne({ email: profile.emails[0].value });
            
            if (scuser) {
                callback_fn(null, scuser);
            } else if (emluser) {
                callback_fn(null, emluser);
            } else {
                let email = profile.emails[0].value;
                let head = email.split("@")[0];
                const uname = head + "-" + random();

                console.log(uname);

                Profile.create({})
                    .then((userProfile) => {
                        const newUser = {
                            socialId: "linkedin" + profile.id,
                            name: profile.displayName,
                            username: uname,
                            email: profile.emails[0].value,
                            image: profile.photos[0].value,
                            profile: userProfile._id
                        }
                        
                        return User.create(newUser);
                    })
                    .then((user) => {
                        callback_fn(null, user);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        } catch (err) {
            console.error(err);
        }
    }
));

passport.serializeUser((user, callback_fn) => {
    callback_fn(null, user.id);
});

passport.deserializeUser((id, callback_fn) => {
    User.findById(id, (err, user) => {
        callback_fn(err, user);
    });
});

module.exports = passport;