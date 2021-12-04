var crypto = require("crypto");
const config = require("./config");
const PLATFORM_FA_ICONS = config.PLATFORM_FA_ICONS;

function random() {
    return crypto.randomBytes(6).toString('hex');
}

function zipLinks(uid, arr1, arr2) {
    const newLinks = {};

    for (let i=0; i < Math.min(arr1.length, arr2.length); i++){
        if ((arr1[i].trim() != "") && (arr2[i].trim() != "")) {
            newLinks[arr1[i]] = {
                user: uid,
                platform: arr1[i],
                url: arr2[i],
                icon: PLATFORM_FA_ICONS[arr1[i]]
            };
        }
    }

    return newLinks;
}

function makeList(ar) {
    if (typeof ar === "string") {
        var temp = [ar];
    } else {
        var temp = ar.map(element => {
            return element.trim();
        });;
    }

    return temp;
}

module.exports = {
    random,
    zipLinks,
    makeList,
};