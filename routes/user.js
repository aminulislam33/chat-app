const express = require('express');
const router = express.Router();
const {
    handleUserSignUp,
    handleUserLogin } = require('../controllers/user');

router.get("/login", (req, res) => {
    return res.render("login");
});

router.get("/signup", (req,res)=>{
    return res.render("signup");
})

router.post('/signup', handleUserSignUp);

router.post("/login", handleUserLogin);

module.exports = router;