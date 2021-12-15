const express = require("express");
const dotenv = require("dotenv");
const app = express();
const multer = require("multer");
const {searchConversation}=require('./routes/index')
const {appendConversation}=require('./routes/index')

const connectDB = require("./config/db");
app.use(express.json());
app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.send("Hello Mani");
// });

// app.get("/user", (req, res) => {
//   res.send("Hello User");
// });


//Load Config
dotenv.config({ path: "./config/config.env" });
connectDB();

//Routes
const myroute = require("./routes/index");
const { Socket } = require("socket.io");

app.use("/", myroute);
const { Conversation } = require("./models/conversation");
app.use("/", require("./routes/index"));
app.use(express.static("public"));

var PORT = process.env.PORT || 3000;

server = app.listen(PORT);
const io = require("socket.io")(server);


io.on("connection", function (socket) {
  console.log("socket connect...", socket.id);
  let convo_id = socket.handshake.query["frontendconvoid"];
  let myid=socket.handshake.query["myid"];
  let secondUserID=socket.handshake.query["secondUserId"];
  socket.join(convo_id);

  console.log(convo_id);
  console.log("myid is "+myid);
  console.log("second userid "+ secondUserID);
  //appendConversation(convo_id,myid,)

  Conversation.findById(convo_id, (err, data) => {
    if (!err) {
      socket.emit("conversationallmessages", data);
    } else {
      console.log(err);
    }
  });

  socket.on("typing", function name(data) {
    console.log(data);
    io.to(convo_id).emit("typing", data);
  });

  socket.on("message", function name(data) {
    console.log(data);
    console.log(convo_id);
    io.to(convo_id).emit("message", data);
    var msg = {
      senderId: data.senderId,
      text: data.message,
      timestamp: data.timestamp,
    };
    Conversation.findOneAndUpdate(
      { _id: convo_id },
      { $push: { message: msg } },
      { new: true },
      (err, conversation) => {
        if (!err) {
          console.log(conversation);
         // socket.emit("newmessage", conversation);
         socket.emit("newmessage", conversation);
        } else {
          console.log(err);
        }
      }
    );
  });
  socket.on("connect", function () {});

  socket.on("disconnect", function () {
    console.log("socket disconnect...", socket.id);
     //handleDisconnect()
  });

  socket.on("error", function (err) {
    console.log("received error from socket:", socket.id);
    console.log(err);
  });
});

// io.on("connection", function (client) {
//   console.log("client connect...", client.id);

//   client.on("typing", function name(data) {
//     console.log(data);
//     io.emit("typing", data);
//   });

//   client.on("message", function name(data) {
//     console.log(data);
//     io.emit("message", data);
//   });

//   client.on("connect", function () {});

//   client.on("disconnect", function () {
//     console.log("client disconnect...", client.id);
//     // handleDisconnect()
//   });

//   client.on("error", function (err) {
//     console.log("received error from client:", client.id);
//     console.log(err);
//   });
// });
