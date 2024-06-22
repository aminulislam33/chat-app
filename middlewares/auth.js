const { getUser } = require("../service/auth");

async function restrictToLoggedInUserOnly(req,res,next){
    const userId = req.cookies.uid;

    if(!userId) return res.redirect("/user/login");
    const user = getUser(userId);
    req.user = user;
    next();
};

module.exports = {
    restrictToLoggedInUserOnly,
}