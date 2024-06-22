const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {createTokenForUser} = require('../service/auth');

const allUsers = new mongoose.Schema ({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    }
});

allUsers.pre("save", async function(next){
    const user = this;

    if(!user.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);

    user.salt = salt;
    user.password = await bcrypt.hash(user.password, salt);
    next(); 
});

allUsers.static("matchUserProvidedPassword", async function(mobileNumber, password) {
    const user = await this.findOne({ mobileNumber });

    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        const token = createTokenForUser(user);
        return token;
    } else {
        throw new Error("Password not matched");
    }
});


const User = mongoose.model("user", allUsers);

module.exports = User;