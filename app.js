const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");

app.use(bodyParser.json());
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
app.use(express.static('public'))

server = app.listen(3000);
const io = require("socket.io")(server);
io.on('connection', function (client) {

  console.log('client connect...', client.id);

  client.on('typing', function name(data) {
    console.log(data);
    io.emit('typing', data)
  })

  client.on('message', function name(data) {
    console.log(data);
    io.emit('message', data)
  })

  
  client.on('connect', function () {
  })

  client.on('disconnect', function () {
    console.log('client disconnect...', client.id)
    // handleDisconnect()
  })

  client.on('error', function (err) {
    console.log('received error from client:', client.id)
    console.log(err)
  })
})

