const express = require('express');
const router = express.Router();
const path = require('path');

const {
    handleUserSignUp,
    handleUserLogin } = require('../controllers/user');

router.get("/login", (req, res) => {
    res.sendFile(path.resolve(__dirname, '../views', 'login.html'));
});

router.get("/signup", (req,res)=>{
    res.sendFile(path.resolve(__dirname, '../views', 'signup.html'));
})

router.post('/signup', handleUserSignUp);

router.post("/login", handleUserLogin);

module.exports = router;