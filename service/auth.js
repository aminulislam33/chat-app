const jwt = require('jsonwebtoken');
const secret = "your_jwt_secret"

function createTokenForUser(user){
    if(!user) return res.redirect("/user/login");

    return jwt.sign({
        email: user.email
    },secret)
};

module.exports = {
    createTokenForUser,
}