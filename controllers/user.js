const User = require('../models/user');

async function handleUserSignUp(req, res) {
    const { firstName, lastName, mobileNumber, password } = req.body;
    console.log(req.body);

    if (!firstName || !lastName || !mobileNumber || !password) {
        return res.status(400).send('<h5 style="font-family: Arial;">All Fields are required</h5>');
    }

    try {
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            return res.status(400).send('<h5 style="font-family: Arial;">Mobile number already registered</h5>');
        }

        const user = await User.create({
            firstName,
            lastName,
            mobileNumber,
            password
        });
        console.log(user);
        return res.redirect("/user/login");
    } catch (error) {
        console.error(error);
        return res.status(500).send('<p style="font-family: Arial;">Internal Server Error</p>');
    }
};


async function handleUserLogin(req,res){
    const {mobileNumber, password} = req.body;
    
    const user = await User.findOne({mobileNumber});

    if(!user) return res.status(400).send("Invalid Mobile Number or Not Registered");

    const token = await User.matchUserProvidedPassword(mobileNumber, password);

    res.cookie("uid", token);
    res.redirect("/");
};

module.exports = {
    handleUserSignUp,
    handleUserLogin
}