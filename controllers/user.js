const User = require('../models/user');
const bcrypt = require('bcrypt');
const { generateKeyPair } = require('../service/cryptoUtils');
const jwt = require('jsonwebtoken');

async function handleUserSignUp(req, res) {
    const { fullName, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const { publicKey, privateKey } = await generateKeyPair();

        const user = await User.create({
            fullName,
            email,
            password,
            publicKey,
            privateKey
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during user sign-up:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


async function handleUserLogin(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or not registered' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 
        });

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    handleUserSignUp,
    handleUserLogin
}