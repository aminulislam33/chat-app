const jwt = require('jsonwebtoken');
const secret = "Super_Secret@23"

function createTokenForUser(user){
    if(!user) return res.redirect("/user/login");

    return jwt.sign({
        mobileNumber: user.mobileNumber
    },secret)
};

function getUser(token){
    return jwt.verify(token, secret)
}

module.exports = {
    createTokenForUser,
    getUser
}