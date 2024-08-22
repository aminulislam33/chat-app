require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const Message = require('./models/Message');
const { Server } = require("socket.io");
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { restrictToLoggedInUserOnly } = require('./middlewares/auth');
const userRouter = require('./routes/user');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

app.use(express.static(path.resolve("./views")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.json({ error: err });
        } else {
            if (req.file == undefined) {
                res.json({ error: 'No file selected!' });
            } else {
                res.json({
                    message: 'Image uploaded successfully!',
                    file: `/uploads/${req.file.filename}`
                });
            }
        }
    });
});

app.use('/uploads', express.static('uploads'));

app.use("/user", userRouter);
app.get("/", (req,res)=>{res.sendFile(path.resolve(__dirname, 'views', 'home.html'));});

app.get("/dashboard", restrictToLoggedInUserOnly, async (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views', 'chat.html'));
});

const io = new Server(server);

io.use(async (socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    const token = cookies?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById({_id: decoded.userId});
            if (user) {
                socket.user = user;
                return next();
            } else {
                return next(new Error('Authentication error'));
            }
        } catch (error) {
            return next(new Error('Authentication error'));
        }
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', (email) => {
        socket.join(email);
        console.log(`User ${socket.user.email} joined room: ${email}`);
    });

    socket.on('sendMessage', async ({ recipient, message }) => {
        try {
            const sender = socket.user._id;

            const recipientUser = await User.findOne({ email: recipient });
            if (!recipientUser) {
                return socket.emit('error', 'Recipient not found');
            }

            socket.emit('message', { sender: 'You', message });
            console.log('Message sent to sender:', message);

            socket.to(recipient).emit('message', { sender: socket.user.email, message });
            console.log('Message sent to recipient:', recipient, message);

            const newMessage = new Message({
                sender,
                recipient: recipientUser._id,
                message
            });

            await newMessage.save();

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.get('/api/user', restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

app.get("/api/users", restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

app.get('/messages/:email', restrictToLoggedInUserOnly, async (req, res) => {
    try {
        const recipientEmail = req.params.email;
        const sender = req.user.userId;
        console.log("sender: ",sender);
        console.log("recipientEamil: ",recipientEmail);

        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const messages = await Message.find({
            $or: [
                { sender: sender, recipient: recipient._id },
                { sender: recipient._id, recipient: sender }
            ]
        }).populate('sender recipient', 'email');

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});