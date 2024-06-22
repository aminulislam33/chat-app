require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require("socket.io");
const path = require('path');
const userRouter = require('./routes/user');
const { default: mongoose } = require('mongoose');
const User = require('./models/user');
const { restrictToLoggedInUserOnly } = require('./middlewares/auth');
const CookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB connected");
    });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.resolve("./public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(CookieParser());

app.use("/user", userRouter);

const io = new Server(server);

io.on("connection", (socket) => {
    socket.on("user-message", (data) => {
        io.emit("message", { user: data.user, message: data.message });
    });
});

app.get("/", restrictToLoggedInUserOnly, async (req, res) => {
    if (!req.user) return res.redirect("/user/login");
    const user = await User.findOne({ mobileNumber: req.user.mobileNumber });
    
    res.render("home", {
        firstName: user.firstName,
        mobileNumber: user.mobileNumber,
    });
});

server.listen(9000, () => {
    console.log("Server Started at 9000");
});