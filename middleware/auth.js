function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        if (req.session) {  
            req.session.redirectUrl = req.headers.referer || req.originalUrl || req.url;  
        }
        res.redirect("/auth/login");
    }
}

function ensureAnony(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect("/dashboard");
    } else {
        return next();
    }
}

module.exports = {
    ensureAuth: ensureAuth,
    ensureAnony: ensureAnony
}