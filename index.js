const http = require('http');
const express = require('express');
const { Server } = require("socket.io");
const path = require('path');
const app = express();

const server = http.createServer(app);

app.use(express.static(path.resolve("./public")));
const io = new Server(server);

io.on("connection", (socket)=>{
    socket.on("user-message", (message)=>{
        io.emit("message", message);
    });
});

app.get("/", (req,res)=>{
    res.render("index");
});

server.listen(9000, ()=>{ 
    console.log("Server Started at 9000");
});