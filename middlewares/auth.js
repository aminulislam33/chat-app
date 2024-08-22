const jwt = require('jsonwebtoken');

async function restrictToLoggedInUserOnly(req,res,next){
    const token = req.cookies.token;

    if (!token) return res.redirect('/user/login');

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.redirect('/user/login');

        req.user = user;
        next();
    });
};

module.exports = {
    restrictToLoggedInUserOnly, 
}