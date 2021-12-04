const fs = require('fs');
const path = require('path');
const express = require("express");
const multer  = require('multer');
const { ensureAuth, ensureAnony } = require("../middleware/auth");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Project = require("../models/Project");
const Invite = require("../models/Invite");
const Link = require("../models/Link");
const Notification = require("../models/Notification");
const utils = require("../utils");
const config = require("../config");

const PLATFORM_CHOICES = config.PLATFORM_CHOICES;
const PLATFORM_FA_ICONS = config.PLATFORM_FA_ICONS;

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/files');
    },
    filename: function (req, file, cb) {
        cb(null, 'resume_' + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({storage: storage})

// Profile Routes
router.get("/dashboard", ensureAuth, (req, res) => {
    return req.user
        .populate({
            path: "profile",
            populate: {
                path: "links",
                model: "Link"
            }
        })
        .then((user) => {
            if (!user) {
                req.flash("warning", "Something went wrong.");
                res.redirect("/dashboard");
            } else {
                res.render("profile/info", {layout: "layouts/dashboard_base.ejs", req, user: req.user, act: "info"});
            }
        })
        .catch((err) => {
            console.log("Error:", err);
            return req.redirect("/dashboard");
        })
});

router.get("/profile/:username", ensureAuth, (req, res) => {
    return User.findOne({username: req.params.username})
        .populate({
            path: "profile",
            populate: {
                path: "links",
                model: "Link"
            }
        })
        .then((fuser) => {
            if (!fuser) {
                req.flash("warning", "User not found.");
                // render 404
                res.redirect("/dashboard");
            } else {
                req.user
                    .populate("projects")
                    .then((user) => {
                        res.render("profile/profile", {layout: "layouts/wide_base.ejs", fuser, req, user});
                    })
                    .catch((err) => {
                        console.log("Error:", err);
                        req.flash("error", "Something went wrong.");
                        return req.redirect("/dashboard");
                    });
            }
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            return req.redirect("/dashboard");
        });
});

router.get("/edit", ensureAuth, async (req, res) => {
    const user = req.user;

    return Profile.findById(user.profile._id)
        .populate("links")
        .then((profile) => {
            if (!profile) {
                req.flash("error", "Something went wrong.");
                res.redirect("/dashboard");
            } else {
                res.render("profile/editprofile", {layout: "layouts/dashboard_base.ejs", req, user, profile, platform_choices: PLATFORM_CHOICES, act: "edit"});
            }
        })
        .catch((err) => {
            console.log("Error: ", err);
            req.flash("error", "Something went wrong.");        
            res.redirect("/edit");
        });
});

router.post("/edit", ensureAuth, upload.single("resume"), async (req, res) => {
    try {
        const data = {
            phone: req.body['phone'].trim(),
            website: req.body['website'].trim(),
            headline: req.body['headline'].trim(),
            location: req.body['location'].trim(),
            about: req.body['about'].trim(),
            skills: utils.makeList(req.body['skills']).filter((skill) => {
                return skill.trim() != "";
            })
        };

        // Modify this piece of shit
        var platforms = req.body['platforms'];
        var urlss = req.body['url'];

        var plats = utils.makeList(platforms);
        var urls = utils.makeList(urlss);
    
        const linkData = utils.zipLinks(req.user._id, plats, urls);
        const userprofile = await Profile.findById(req.user.profile);

        let linkIds = [];

        for (plat of PLATFORM_CHOICES) {
            const elem = linkData[plat];
            if (elem) {
                const link = await Link.findOneAndUpdate({user: elem['user'], platform: elem['platform']}, elem, {new: true, upsert: true});
                linkIds.push(link._id);
            } else {
                await Link.findOneAndDelete({user: req.user._id, platform: plat})
            }
        }

        userprofile.links = linkIds;
        userprofile.save();

        const resume = req.file;
        const profile = await Profile.findByIdAndUpdate(req.user.profile._id, data);

        if (resume) {
            let prev = profile.resume;
            profile.resume = resume['filename'];

            if (prev) {
                fs.unlink("./public/files/" + prev, (err) => {
                    if (err) { console.log("Error:", err); }
                });
            }

            return profile.save();
        }

        req.flash("info", "Profile updated.");
        res.redirect("/edit");
    } catch(err) {
        console.log("Error: ", err);
        req.flash("error", "Something went wrong.");        
        res.redirect("/edit");
    };
});

router.get("/chat", ensureAuth, (req, res) => {
    res.render("profile/chat", {layout: "layouts/dashboard_base.ejs", req, user: req.user, act: "chat"});
});

router.get("/projects", ensureAuth, (req, res) => {
    return Project
        .find({
            $or: [{
                    creator: req.user._id
                },
                {
                    contributors: req.user._id
                },
            ]
        })
        .populate("contributors")
        .populate("creator")
        .sort({createdAt: -1})
        .then((projects) => {
            res.render("profile/projects", {layout: "layouts/dashboard_base.ejs", req, projects, user: req.user, act: "proj"});
        })
        .catch((err) => {
            console.log("Error:", err);
            res.redirect("/");
        })
});

router.post("/projects", ensureAuth, async (req, res) => {
    const newProj = {
        name: req.body["name"],
        description: req.body["description"],
        liveUrl: req.body["liveUrl"],
        codeUrl: req.body["codeUrl"],
        technologies: req.body["technologies"],
        contributors: [req.user._id],
        creator: req.user._id
    };

    // Use "return" or "req.flash" won't work.
    return Project.create(newProj)
        .then((proj) => {
            req.user.projects.push(proj._id);
            return req.user.save();
        })
        .then((proj) => {
            req.flash("success", "New Project created.");
            res.redirect("/projects");
        })
        .catch((err) => {
            req.flash("error", "Something went wrong.");
            res.redirect("/projects");
        });
})

router.get("/projects/edit/:id", ensureAuth, async (req, res) => {
    const project = await Project.findById(req.params.id);
    res.render("profile/editproject", {layout: "layouts/dashboard_base.ejs", req, user: req.user, project, act: "proj"});
});

router.put("/projects/edit/:id", ensureAuth, (req, res) => {
    // Use "return" or "req.flash" won't work.
    return Project.findById(req.params.id)
        .then((project) => {
            if (!project.creator.equals(req.user._id)) {
                req.flash("error", "Access Denied.");
                res.redirect("/projects");
            } else {
                return Project.findOneAndUpdate({_id: req.params.id}, req.body, {
                    runValidators: true,
                    new: false
                })
            }
        })
        .then((project) => {
            req.flash("info", "Project details updated.");
            res.redirect("/projects");
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/projects");
        });
});

router.delete("/projects/:id", ensureAuth, (req, res) => {
    return Project.findById(req.params.id)
        .then((project) => {
            if (!project.creator.equals(req.user._id)) {
                req.flash("error", "Access Denied.");
                res.redirect("/projects");
            } else {
                return Project.findOneAndDelete({_id: req.params.id});
            }
        })
        .then((project) => {
            req.flash("info", "Project deleted.");
            res.redirect("/projects");
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/projects");
        });
});

router.get("/people", ensureAuth, (req, res) => {
    return req.user
        .populate("projects")
        .then((user) => {
            if (!user) {
                req.flash("error", "Something went wrong");
                res.redirect("/dashboard");
            } else {
                return user;
            }
        })
        .then((user) => {
            User.find({_id: { $nin: [req.user._id] } } )
                .populate({
                    path: "profile",
                    populate: {
                        path: "links",
                        model: "Link"
                    }
                })
                .then((allfusers) => {
                    if (allfusers) {
                        res.render("profile/people", {layout: "layouts/wide_base.ejs", req, user, allfusers});
                    } else {
                        res.redirect("/dashboard");
                    }
                })
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong");
            res.redirect("/dashboard");
        })
});

router.post("/invite/:username", ensureAuth, (req, res) => {
    var message = req.body['message'];
    var projid = req.body['projid'];

    return User.findOne({username: req.params['username']})
        .then((fuser) => {
            if (!fuser) {
                req.flash("warning", "User not found.");
                // render 404
                res.redirect("/dashboard");
            } else if (fuser._id.equals(req.user._id)) {
                req.flash("warning", "You can't send invite to yourself.");
                res.redirect("/dashboard");
            } else {
                Project.findById(projid)
                    .then((project) => {
                        data = {
                            from: req.user._id,
                            to: fuser._id,
                            project: project,
                            message: message
                        };

                        return Invite.create(data);
                    })
                    .then((invite) => {
                        req.flash("info", "Invite Sent to " + fuser.name);
                        res.redirect("/invites");
                    })
                    .catch((err) => {
                        console.log("Error:", err);
                        res.redirect("/")
                    });
            }
        })
        .catch((err) => {
            console.log("Error:", err);
            res.redirect("/")
        });
});

router.get("/invites", ensureAuth, (req, res) => {
    Invite.find({from: req.user._id, status: "pending"})
        .populate({
            path: "to",
            populate: {
                path: "profile",
                model: "Profile"
            }
        })
        .populate("project")
        .sort({createdAt: -1})
        .then((sent_inv) => {
            Invite.find({to: req.user._id, status: "pending"})
                .populate({
                    path: "from",
                    populate: {
                        path: "profile",
                        model: "Profile"
                    }
                })
                .populate("project")
                .sort({createdAt: -1})
                .then((received_inv) => {
                    res.render("profile/invites", {layout: "layouts/dashboard_base.ejs", req, sent_inv, received_inv, user: req.user, act: "invt"});
                })
                .catch((err) => {
                    console.log("Error:", err);
                    res.redirect("/invites");
                })
        })
        .catch((err) => {
            console.log("Error:", err);
            res.redirect("/invites");
        })
});

router.get("/invites/accept/:inv_id", ensureAuth, (req, res) => {
    return Invite.findById(req.params.inv_id)
        .populate("project")
        .then((invite) => {
            if (!invite.to.equals(req.user._id)) {
                req.flash("error", "Access Denied.");
                res.redirect("/invites");
            } else {
                invite.status = "accepted";
                return invite.save();
            }
        })
        .then((invite) => {
            var uid = invite.from;
            var proj = invite.project.name;

            var data = {
                user: uid,
                text: `${req.user.name} has accepted your invitation to join "${proj}"`
            }

            Notification.create(data)
                .catch((err) => {
                    console.log("Error:", err);
                    req.flash("error", "Something went wrong.");
                    res.redirect("/invites");
                });
            
            return invite;
        })
        .then((invite) => {
            var data = {
                user: invite.to,
                text: `You have been added to project "${invite.project.name}"`
            }

            Notification.create(data)
                .catch((err) => {
                    console.log("Error:", err);
                    req.flash("error", "Something went wrong.");
                    res.redirect("/invites");
                });
            
            return invite;
        })
        .then((invite) => {
            return Project.findById(invite.project._id);
        })
        .then((project) => {
            if (!project) {
                req.flash("error", "Project not found.");
                res.redirect("/invites");
            } else {
                return project;
            }
        })
        .then((project) => {
            // TODO: Check if user is already present

            var isPresent = false;
            for (person of project.contributors) {
                if (person._id.equals(req.user._id)) {
                    isPresent = true;
                    break;
                }
            }

            if (!isPresent) {
                project.contributors.push(req.user._id);
            }

            return project.save();
        })
        .then((proj) => {
            req.flash("info", "Invite accepted.");
            res.redirect("/invites");
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/invites");
        });
});

router.get("/invites/decline/:inv_id", ensureAuth, (req, res) => {
    return Invite.findById(req.params.inv_id)
        .then((invite) => {
            if (!invite.to.equals(req.user._id)) {
                req.flash("error", "Access Denied.");
                res.redirect("/invites");
            } else {
                invite.status = "rejected";
                return invite.save();
            }
        })
        .then((invite) => {
            req.flash("info", "Invite declined.");
            res.redirect("/invites");
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/invites");
        })
});

router.get("/invites/cancel/:inv_id", ensureAuth, (req, res) => {
    return Invite.findById(req.params.inv_id)
        .then((invite) => {
            if (!invite.from.equals(req.user._id)) {
                req.flash("error", "Access Denied.");
                res.redirect("/invites");
            } else {
                return invite.remove();
            }
        })
        .then((invite) => {
            req.flash("info", "Invite cancelled.");
            res.redirect("/invites");
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/invites");
        })
});

// General Routes
router.get("/", ensureAnony, (req, res) => {
    res.render("general/home", {req});
});

router.get("/about", (req, res) => {
    res.render("general/about", {req});
});

router.get("/contact", ensureAuth, (req, res) => {
    res.render("general/contact", {req, user: req.user});
});

router.get("/notifications", ensureAuth, (req, res) => {
    Notification.find({user: req.user._id})
        .sort({createdAt: -1})
        .then((notifys) => {
            res.render("profile/notifications", {layout: "layouts/dashboard_base.ejs", req, notifications: notifys, user: req.user, act: "ntfy"});
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/dashboard");
        })
});


router.post("/notifications/clear", ensureAuth, (req, res) => {
    Notification.deleteMany({user: req.user._id})
        .then((notifys) => {
            req.flash("info", "Cleared all notifications.");
            res.redirect("/notifications")
        })
        .catch((err) => {
            console.log("Error:", err);
            req.flash("error", "Something went wrong.");
            res.redirect("/dashboard");
        })
});

module.exports = router;