const express = require("express");
const passport = require("passport");
const router = express.Router();

router.get("/login", (req, res) => {
    res.render("auth/login", {req});
});

// Google Authentication

// @desc    Auth with Google
// @route   GET /auth/google
router.get("/google", passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
}));

// @desc    Google Auth Callback
// @route   GET /auth/google/callback
router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/auth/login",
}), (req, res) => {
        var rurl = req.session.redirectUrl || "/";
        delete req.session.redirectUrl;
        res.redirect(rurl);
});


// Github Authentication

// @desc    Auth with Github
// @route   GET /auth/github
router.get('/github', passport.authenticate('github', {
    scope: ["openid", "profile", "email"],
}));

// @desc    Github Auth Callback
// @route   GET /auth/github/callback
router.get('/github/callback', passport.authenticate('github', {
    failureRedirect: '/auth/login'
}), (req, res) => {      
    var rurl = req.session.redirectUrl || "/";
    delete req.session.redirectUrl;
    res.redirect(rurl);
});

// linkedin Authentication

// @desc    Auth with linkedin
// @route   GET /auth/linkedin
router.get('/linkedin', passport.authenticate('linkedin', {
    scope: ['r_emailaddress', 'r_liteprofile'],
}));

// @desc    linkedin Auth Callback
// @route   GET /auth/linkedin/callback
router.get('/linkedin/callback', passport.authenticate('linkedin', {
    failureRedirect: '/auth/login'
}), (req, res) => {      
    var rurl = req.session.redirectUrl || "/";
    delete req.session.redirectUrl;
    res.redirect(rurl);
});

// @desc    Logout
// @route   GET /auth/logout
router.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/");
});

module.exports = router;