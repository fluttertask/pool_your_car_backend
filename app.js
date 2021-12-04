const express = require("express");
const dotenv = require("dotenv");
const app = express();
const multer = require("multer");

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello Mani");
});

app.get("/user", (req, res) => {
  res.send("Hello User");
});

const connectDB = require("./config/db");

//Load Config
dotenv.config({ path: "./config/config.env" });
connectDB();

//Routes
const myroute = require("./routes/index");
const { Socket } = require("socket.io");

app.use("/", myroute);

app.use("/", require("./routes/index"));
app.use(express.static('public'));

var PORT = process.env.PORT || 3000;

server = app.listen(PORT);
const io = require("socket.io")(server);
io.on('connection', function (client) {

  console.log('client connect...', client.id);

  client.on('typing', function name(data) {
    console.log(data);
    io.emit('typing', data);
  });

  client.on('message', function name(data) {
    console.log(data);
    io.emit('message', data);
  });

  
  client.on('connect', function () {
  });

  client.on('disconnect', function () {
    console.log('client disconnect...', client.id);
  });

  client.on('error', function (err) {
    console.log('received error from client:', client.id);
    console.log(err);
  });
})

