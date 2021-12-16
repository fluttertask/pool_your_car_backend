const express = require("express");
const path = require("path");
const { Ride } = require("../models/ride");
const { User } = require("../models/user");
const { Admin } = require("../models/admin");
const { Wallet } = require("../models/wallet");
const { Payment } = require("../models/payment");
const users_collection = "users";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { response } = require("express");
const router = express.Router();
const multer = require("multer");
const { appendFile } = require("fs");
const DIR = "./public/images";
var dateFormat = require("dateformat");
const { json } = require("body-parser");
var now = new Date();

var ACCESS_TOKEN_SECRET =
  "b54ac46479029787c3098b500f5df4e06e8cb612263bfa024d630bba2cb1a921a7d8c59c6c635cdc41c9c5e0416bad8e14a8195e3245bac3adcc74dfec11e2ee";
var val = Math.floor(1000 + Math.random() * 9000);
console.log(val);

//storing image on server
const filestorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const upload = multer({
  storage: filestorageEngine,
});

router.post(
  "/api/upload_profile_image/:userid",
  upload.single("image"),
  (req, res) => {
    console.log(req.file);
    console.log("path name");
    console.log(req.file.filename);
    User.findOneAndUpdate(
      { _id: req.params.userid },
      { $set: { profile_image_url: req.file.filename } },
      { new: true },
      (err, user, doc) => {
        if (!err) {
          console.log(user.profile_image_url);
          res.status(200).json({
            code: 200,
            message: "Profile image uploaded",
            updateUser: user,
          });
        } else {
          console.log(err);
        }
      }
    );
    //res.send("File upload success");
  }
);

//UserLogin
router.post("/api/user/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    console.log("my email" + user);
    if (user == null) {
      res.status(400).json("Invalid email ");
    } else {
      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        console.log(user);
        const accessToken = jwt.sign(
          {
            email: user.email,
          },
          ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );
        let response = {};
        response.accessToken = accessToken;
        response.user = user;
        res.status(200).json(response);
      } else {
        res.status(400).json("Invalid password");
      }
    }
  });
});

var authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);
  if (token == null) {
    return res.status(401).json("Authentication Failed");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
    // if (err) {
    //   return res.status(403).json("Access Token Expired");
    // }
    // req.user = user;
    next();
  });
};

// User Logout
// router.get("/api/user/logout", function(req, res) => {
//   router.session({}, function(err) => {
//     if (err) {
//       res.send(err);
//      }
//      //else {
//     //   res.redirect
//     // }
//   });
// });

//Send OTP to email by NodeMailer
let transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  service: "gmail",
  auth: {
    user: "poolyourc@gmail.com",
    pass: "zwiskunthonrxssq",
  },
});

router.post("/api/user/sendemailotp", (req, res) => {
  console.log(val);
  transporter.sendMail(
    {
      from: '"PoolYourCar 👻" <poolyourc@gmail.com>', // sender address
      to: req.body.email, // list of receivers
      subject: "Email Verification ✔", // Subject line
      text: "Email Verification code", // plain text body
      html: "<b>Your verification code is " + val + "</b>", // html body
    },
    function (error, info) {
      if (error) {
        res.send(error);
      } else {
        res.send("Email sent: " + info.response);
      }
    }
  );
});

//Verifying Email by Checking correct OTP Provided by User
router.put("/api/user/verifyemail/:id", (req, res) => {
  console.log(req.params.id);
  // User.findById(req.params.id, (err, user) => {
  if (req.body.code == val) {
    User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { emailverified: true } },
      { new: true },
      (err, user, doc) => {
        if (!err) {
          console.log(user.emailverified);
          res.status(200).json({
            code: 200,
            message: "Email Verified",
            updateUser: doc,
          });
        } else {
          console.log(err);
        }
      }
    );
  } else {
    console.log("bbhr");
    res.json("Invalid code");
  }
  // });
});

//Get all user
router.get("/api/user/getalluser", (req, res) => {
  User.find({}, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
    }
  });
});

//User Signup
router.post("/api/user/add", (req, res, next) => {
  var datetime = new Date();
  date = datetime.toJSON();
  console.log(req.body);
  let hash = bcrypt.hashSync(req.body.password, 10);
  if (req.body) {
    User.findOne(
      {
        email: req.body.email,
        //phonenumber: req.body.phonenumber,
      },
      function (err, result) {
        if (result) {
          res
            .status(400)
            .json("Email " + req.body.email + '" is already taken');
        }else{
          User.findOne(
            {
              phonenumber: req.body.phonenumber,
            },
      
            function (err, result) {
              if (result) {
                res
                  .status(400)
                  .json(
                    "Phone number " + req.body.phonenumber + '" is already taken'
                  );
              }else{
                var newuser = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                phonenumber: req.body.phonenumber,
                email: req.body.email,
                password: hash,
                confirmpassword: hash,
                createdat: date,
              };
              User.create(newuser)
                .then(
                  (user) => {
                    console.log("User has been Added ", user);
      
                    Wallet.create({
                      uniqueId: req.body.phonenumber,
                      userId: user._id,
                    })
                    .then(
                      (user) => {
                        console.log("Wallet has been created ", user);
                      },
                      (err) => next(err)
                    )
                    .catch((err) => next(err));
      
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(user);
                  },
                  (err) => next(err)
                )
                .catch((err) => next(err));
              }
      
              
            }
          );
        }
      }
    );
  } else {
    res.status(400).json({
      message: "Missing Parameters",
    });
  }
});

//Get single USer

router.get("/api/getsingleuser/:id", (req, res) => {
  User.findById(req.params.id, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
    }
  });
});

//Update USer
router.put("/api/user/edituser/:id", (req, res) => {
  User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
    (err, data) => {
      if (!err) {
        res.status(200).json({
          code: 200,
          message: "User updated successfully",
          updateUser: data,
        });
      } else {
        console.log(err);
      }
    }
  );
});

//Update password

router.put("/api/user/updatepassword/:id", (req, res) => {
  let hashpassword = bcrypt.hashSync(req.body.password, 10);

  User.findById(req.params.id, (err, user, data) => {
    console.log("this is the user", user);
    if (bcrypt.compareSync(req.body.currentpassword, user.password)) {
      console.log(user.password);

      User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { password: hashpassword, confirmpassword: hashpassword } },
        { new: true },
        (err, doc) => {
          if (!err) {
            console.log(doc);
            res.status(200).json({
              code: 200,
              message: "Password Updated",
              updateUser: doc,
            });
            //console.log("Password Updated");
          } else {
            console.log(err);
          }
        }
      );
    } else {
      console.log(err);
    }
  });
});

//Delete User

router.delete("/api/user/delete/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id, (err, data) => {
    if (!err) {
      res.status(200).json({
        code: 200,
        message: "User deleted successfully",
        deleteUser: data,
      });
    } else {
      console.log(err);
    }
  });
});

////////////////////////////////////////////////////////////////
//Rides API's

//Get all offered Rides overall
router.get("/api/ride/getoverallofferedrides", (req, res) => {
  var completedate;
  var combine_date_time_string;
  var dateNow = new Date();
  var filterededrides = [];

  Ride.find({}, (err, data) => {
    data.forEach((_data) => {
      combine_date_time_string = _data.date + " " + _data.time;
      completedate = new Date(combine_date_time_string);
      if (completedate > dateNow) {
        filterededrides.push(_data);
      }
    });
    if (!err) {
      res.send(filterededrides);
    } else {
      console.log(err);
    }
  });
});

//Add Ride
router.post("/api/ride/add", (req, res, next) => {
  User.findById(
    req.body.driverId,
    (err, result) => {
      if (result.blocked == 'blocked'){
        res.status(200).json({
          code: 400,
          message: "Blocked User, Please Contact Admin",
          updateUser: doc,
        });
      }else{
        Ride.create(req.body)
        .then(
          (ride) => {
            console.log("Ride has been Added ", ride);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            // res.json(ride);
            console.log(ride._id);

            User.findOneAndUpdate(
              { _id: req.body.driverId },
              { $push: { offeredride: ride._id } },
              { new: true },
              (err, doc) => {
                if (!err) {
                  console.log(doc);
                  res.status(200).json({
                    code: 200,
                    message: "Ride created for Users",
                    updateUser: doc,
                  });
                } else {
                  console.log(err);
                }
              }
            );
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
      }
    }
  )
});

//Get single Offered Ride of user

router.get("/api/ride/getsingleofferedride/:id", (req, res) => {
  Ride.findById(req.params.id, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
    }
  });
});

//Update offered Ride of user
router.put("/api/ride/editofferedride/:id", (req, res) => {
  Ride.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
    (err, data) => {
      if (!err) {
        res.status(200).json({
          code: 200,
          message: "Ride updated successfully",
          updateRide: data,
        });
      } else {
        console.log(err);
      }
    }
  );
});

//Delete offered Ride of user

router.delete("/api/ride/deleteofferedride/:id", (req, res) => {
  Ride.findByIdAndDelete(req.params.id, (err, data) => {
    if (!err) {
      console.log(data);

      if (data != null) {
        User.findOneAndUpdate(
          { _id: req.body.userId },
          { $pull: { offeredride: data.driverId } },
          { new: true },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        ),
        res.json({
          code: 200,
          message: "Ride deleted successfully",
          deleteRide: data,
        });
        Wallet.findOneAndUpdate(
          {userId:  data.driverId},
          {$inc: {balance: -(data.ridefare*0.2*data.passengersID.length)}},
          (err, result) => {
            if (!err) {
              console.log('updating wallet');
            }else{
              console.log('Error updating wallet');
            }
          }
        );

        data.requestedPassengers.map((passenger)=>{
          User.findOneAndUpdate(
            { _id: passenger },
            { $pull: { bookedride: req.params.id }
            },
            { new: true },
            (err, doc) => {
              if (!err) {
                console.log(doc);
              } else {
                console.log(err);
              }
            }
          );
        });

        data.passengersID.map((passenger)=>{
          User.findOneAndUpdate(
            { _id: passenger },
            { $pull: { bookedride: req.params.id }
            },
            { new: true },
            (err, doc) => {
              if (!err) {
                console.log(doc);
              } else {
                console.log(err);
              }
            }
          ),
          Wallet.findOneAndUpdate(
            {userId: passenger},
            {$inc: {balance: +(data.ridefare*0.2)}},
            (err, result) => {
              if (!err) {
                console.log('updating wallet');
              } else {
                console.log('Error updating wallet');
              }
            }
          );
        });
      } else {
        res.json({
          code: 200,
          message: "Ride not found",
        });
      }
    } else {
      console.log(err);
    }
  });
});

//find all offered rides of single user
router.get("/api/ride/getallofferedridesofuser/:userid", (req, res) => {
  var dateNow = new Date();

  // var newdate;
  var completedate;
  var combine_date_time_string;

  //var dateTime = convertToDateTime("23.11.2009 12:34:56", "dd.MM.yyyy HH:mm:ss");
  User.findById(req.params.userid)
    .populate("offeredride")
    .then((ride) => {
      //console.log(ride.offeredride[0].time);
      //date = dateFormat(ride.offeredride[0].date, "dddd, mmmm d, yyyy");
      ride.offeredride.forEach((_ride) => {
        combine_date_time_string = _ride.date + " " + _ride.time;
        completedate = new Date(combine_date_time_string);
        //newdate = dateFormat(completedate, "dddd, mmmm d, yyyy h:MM TT");

        if (completedate < dateNow) {
          //console.log(completedate + " is less than " + dateNow);

          User.findOneAndUpdate(
            { _id: req.params.userid },
            { $push: { pastofferedride: _ride.id } },
            { new: true },
            (err, doc) => {
              if (!err) {
                console.log(doc);
                User.findOneAndUpdate(
                  { _id: req.params.userid },
                  { $pull: { offeredride: _ride.id } },
                  { new: true },
                  (err, doc) => {
                    if (!err) {
                      console.log(doc);
                    } else {
                      console.log(err);
                    }
                  }
                );

                // res.status(200).json({
                //   code: 200,
                //   message: "Ride added in past offered ride successfully",
                //   updateUser: doc,
                // });
              } else {
                console.log(err);
              }
            }
          );
        } else {
          console.log(completedate + " is greater than " + dateNow);
        }
      });

      res.json(ride);
    });
  // .exec((err, offeredride) => {
  //   if (!err) {
  //     res.send(offeredride);
  //   } else {
  //     console.log(err);
  //   }
  // });
});

//Get past offered rides of user
router.get("/api/ride/getallpastofferedridesofuser/:userid", (req, res) => {
  User.findById(req.params.userid)
    .populate("pastofferedride")
    .then((pastofferedride) => {
      res.json(pastofferedride);
    });
});

//Delete Past offered ride of user
router.delete("/api/ride/deletepastofferedride/:id", (req, res) => {
  Ride.findByIdAndDelete(req.params.id, (err, data) => {
    if (!err) {
      console.log(data);

      if (data != null) {
        User.findOneAndUpdate(
          { _id: req.body.userId },
          { $pull: { pastofferedride: req.params.id } },
          { new: true },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        ),
          res.json({
            code: 200,
            message: "Past Offered Ride deleted successfully",
            deleteRide: data,
          });
      } else {
        res.json({
          code: 200,
          message: "Ride not found",
        });
      }
    } else {
      console.log(err);
    }
  });
});

//Get single booked Ride of user

router.get("/api/ride/getsinglebookedride/:id", (req, res) => {
  Ride.findById(req.params.id, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      console.log(err);
    }
  });
});

//find all booked rides of single user
router.get("/api/ride/getallbookedridesofuser/:userid", (req, res) => {
  var dateNow = new Date();

  // var newdate
  var completedate;
  var combine_date_time_string;

  //var dateTime = convertToDateTime("23.11.2009 12:34:56", "dd.MM.yyyy HH:mm:ss");
  User.findById(req.params.userid)
    .populate("bookedride")
    .then((ride) => {
      //console.log(ride.offeredride[0].time);
      //date = dateFormat(ride.offeredride[0].date, "dddd, mmmm d, yyyy");
      ride.bookedride.forEach((_ride) => {
        combine_date_time_string = _ride.date + " " + _ride.time;
        completedate = new Date(combine_date_time_string);
        //newdate = dateFormat(completedate, "dddd, mmmm d, yyyy h:MM TT");

        if (completedate < dateNow) {
          //console.log(completedate + " is less than " + dateNow);

          User.findOneAndUpdate(
            { _id: req.params.userid },
            { $push: { pastbookedride: _ride.id } },
            { new: true },
            (err, doc) => {
              if (!err) {
                console.log(doc);
                User.findOneAndUpdate(
                  { _id: req.params.userid },
                  { $pull: { bookedride: _ride.id } },
                  { new: true },
                  (err, doc) => {
                    if (!err) {
                      console.log(doc);
                    } else {
                      console.log(err);
                    }
                  }
                );
              } else {
                console.log(err);
              }
            }
          );
        } else {
          console.log(completedate + " is greater than " + dateNow);
        }
      });

      res.json(ride);
    });
});

// Get all passengers in a ride

router.get("/api/ride/passengers/:id", (req, res)=>{
  Ride.findById(
    req.params.id,
    (err, data) => {
    if (!err) {

      if (data != null) {
          
        User.find(
          {_id: { 
            $in: data.passengersID,
          }},
          (err, passengers)=>{
            console.log(passengers)
            User.find(
              {_id: { 
                $in: data.requestedPassengers
              }},
              (err, requestedPassengers)=>{
                console.log(requestedPassengers)
                return res.json({
                  code: 200,
                  message: "Passenger has been provided",
                  passengers: passengers,
                  requestedpassengers: requestedPassengers,
                })
              }
            )
          }
        )
      }
    }else{
      res.json({
        code: 401,
        message: "Passenger could not be provided",
      });
    }
  })
});

//Listening for notification

router.get("/api/ride/listenfornotifications/:id", (req, res)=>{
  User.findById(req.params.id)
  .populate('notifications')
  then((notifications)=>{
    res.json(notifications);
  });
})

//Checking for Notifications

router.get("/api/ride/requestnotifications/:id", (req, res)=>{
  User.findById(req.params.id)
  .populate('notifications')
  .then((notifications)=>{
    res.json(notifications);
  });
})

router.post("/api/ride/cancelnotification/", (req, res)=>{
  User.findOneAndUpdate({
      _id: req.body.userId,
    },
    {
      $pull: {
        notifications: {
          ride: req.body.rideId,
          senderID: req.body.passengerID
        }
      }
    })
  .then((user)=>{
    res.json({
      code: 200,
      message: "Accepted"
    });
  });
})

//Accept ride request from the passenger by the Driver

router.post('/api/ride/acceptbookedride', (req, res)=>{
  console.log(req.body);
  Ride.findByIdAndUpdate(
    req.body.rideId,
    {
      $push: {passengersID: req.body.passengerID},
      $pull: {requestedPassengers: req.body.passengerID},
      $inc: { availableseats: -1}
    },
    (err, ride) => {
      if (err || !ride){
        console.log(err);
        res.json({
          code: 200,
          message: "Error accepting Ride"
        })
      }else{
        // console.log(ride);
        res.json({
          code: 200,
          message: "Ride Accepted"
        });

        console.log(ride);

        Wallet.findOneAndUpdate(
          {userId: req.body.passengerID},
          {
            $inc: {balance: -(ride.ridefare * 0.2)}
          },
          (err, wallet) => {
        });
        Wallet.findOneAndUpdate(
          {userId: ride.driverId},
          {
            $inc: {balance: +(ride.ridefare * 0.2)}
          },
          (err, wallet) => {
        });
        
        User.findByIdAndUpdate(
          req.body.userId,
          {
            $pull: {
              notifications: {
                senderID: req.body.passengerID,
                ride: req.body.rideId,
              }
            },
          },
          (err, doc) =>{
            if (err) {
              console.log(err);
            }else{
              console.log(doc)
            }
          }
        );
        
      }
    }
  )
})

//Reject ride request from the passenger by the Driver

router.post('/api/ride/rejectbookedride', (req, res) => {
  Ride.findByIdAndUpdate(
    req.body.rideId,
    {
      $pull: {requestedPassengers: req.body.passengerID},
    },
    (err, ride) => {
      if (err){
        console.log(err);
        res.json({
          code: 200,
          message: "Error In Rejecting Ride",
        })
      }else{
        console.log(ride);
        User.findByIdAndUpdate(
          req.body.userId,
          {
            $pull: {
              notifications: {
                senderID: req.body.passengerID,
                ride: req.body.rideId,
              }
            },
          },
          (err, doc) =>{
            if (err) {
              console.log(err);
            }else{
              console.log(doc)
            }
          }
        )
        res.json({
          code: 200,
          message: "Ride Rejected"
        })
      }
    }
  )
})

// Book ride api

router.post("/api/ride/bookride/:id", (req, res) => {
  console.log(req.body);
  User.findById(
    req.body.userId,
    (err, result) => {
      if (err) return console.log(err);
      console.log(result);
      if (result.blocked == 'blocked'){
        res.status(400).json("Blocked User, Please Contact Admin");
      }else{
        Wallet.findOne(
          {userId: req.body.userId},
          (err, wallet) => {
            if (err) return console.error(err);
            Ride.findById(
              req.params.id,
              (err, ride) => {
                if (wallet.balance > ride.ridefare){
                  Ride.findByIdAndUpdate(
                    req.params.id, 
                    {
                      $push: {requestedPassengers: req.body.userId},
                    },
                    {new: true},
                    (err, data) => {
                    if (!err) {
          
                      if (data != null) {
                        User.findOneAndUpdate(
                          { _id: req.body.userId },
                          { 
                            $push: { bookedride: req.params.id } ,
                          },
                          { new: true },
                          (err, doc) => {
                            if (!err) {
                              // console.log(doc);
                              User.findOneAndUpdate(
                                { _id: data.driverId},
                                { $push: { notifications: {
                                    senderID: req.body.userId,
                                    type: 'bookrequest',
                                    from: data.pickuplocation,
                                    to: data.droplocation,
                                    ride: req.params.id,
                                    name: doc.firstname,
                                    message: `Ride has been requested by ${doc.firstname} ${doc.lastname}`,
                                    read: false
                                }, } },
                                { new: true },
                                (err, data) => {
                                  if (!err) {
                                    // console.log(doc);
                                  } else {
                                    console.log(err);
                                  }
                                }
                              );
                            } else {
                              console.log(err);
                            }
                          }
                        );
                        res.json("Ride booked successfully");
                       
                      } else {
                        res.status(400).json("Ride not found");
                      }
                    } else {
                      console.log(err);
                    }
                  });
                }else{
                  res.status(400).json("Insufficient Fund");
                }
              }
            )
          }
        )
      }
    });
});


//cancel booked ride api

router.post("/api/ride/cancelbookedride/:id", (req, res) => {
  console.log(req.params.id);
  console.log(req.body);
  Ride.findById(
    req.params.id,
    (err, datas) => {
      console.log('datas')
      console.log(datas)
      if (err) return;
      Ride.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {requestedPassengers: req.body.userId},
          $pull: {passengersID: req.body.userId},
          $pull: {readyPassengersID: req.body.userId},
          $inc: { availableseats: +1}
        },
        (err, data) => {
        if (!err) {
          console.log(data);

          if (data != null) {

            User.findOneAndUpdate(
              { _id: req.body.userId },
              { $pull: { bookedride: req.params.id } },
              { new: true },
              (err, doc) => {
                if (!err) {
                  console.log(doc);
                } else {
                  console.log(err);
                }
              }
            );

            const d = new Date(data.date + ' ' + data.time);
            const n = new Date();

            var last = (((((d.getFullYear() * 12) + d.getMonth()) * 30) + d.getDate()) * 24)+d.getHours();
            var now = (((((n.getFullYear() * 12) + n.getMonth()) * 30) + n.getDate()) * 24)+n.getHours();
            console.log()
            if ((last - now) < 6) {
              
            }else {
              Wallet.findOneAndUpdate(
                {userId:  data.driverId},
                {$inc: {balance: -(data.ridefare*0.2)}},
                (err, result) => {
                  if (!err) {
                    console.log('updating wallet');
                  }else{
                    console.log('Error updating wallet');
                  }
                }
              );

              datas.passengersID.map((passenger) => {
                Wallet.findOneAndUpdate(
                  {userId: passenger},
                  {$inc: {balance: +(data.ridefare*0.2)}},
                  (err, result) => {
                    if (!err) {
                      console.log('updating wallet');
                    } else {
                      console.log('Error updating wallet');
                    }
                  }
                );
              })
              // Wallet.findOneAndUpdate(
              //   {userId: req.body.userId},
              //   {$inc: {balance: +(data.ridefare*0.2)}},
              //   (err, result) => {
              //     if (!err) {
              //       console.log('updating wallet');
              //     } else {
              //       console.log('Error updating wallet');
              //     }
              //   }

              // );
              
            }

            res.json({
              code: 200,
              message: "Ride has been cancelled successfully",
              deleteRide: data,
            });
          } else {
            Ride.findByIdAndUpdate(
              req.params.id, 
              {
                $pull: {requestedPassengers: req.body.userId},
              },
              {new: true},
              (err, data) => {
              if (!err) {
                console.log(data);
          
                if (data != null) {
                  User.findOneAndUpdate(
                    { _id: req.body.userId },
                    { $pull: { bookedride: req.params.id } },
                    (err, doc) => {
                      if (!err) {
                        console.log(doc);
                      } else {
                        console.log(err);
                      }
                    }
                  ),
                    res.json({
                      code: 200,
                      message: "Booked ride has been removed successfully",
                      deleteRide: data,
                    });
                } else {
                  res.json({
                    code: 200,
                    message: "Ride not found",
                  });
                }
              } else {
                console.log(err);
              }
            });
          }
        } else {
          console.log(err);
        }
      });
    }
  );
});


// accept ride to start journey by driver

router.post('/api/ride/acceptstartride', (req, res)=>{
  Ride.findOneAndUpdate(
    {
      _id: req.body.rideId,
    },
    {
      $push: {
        readyPassengersID: req.body.userId
      },
    },
    (err, ride) => {
      if (err){
        console.log(err);
        res.json({
          code: 200,
          message: "Error accepting Ride"
        })
      }else{
        console.log(ride);
        res.json({
          code: 200,
          message: "Ride Accepted"
        });
        User.findByIdAndUpdate(
          ride.driverId,
          {
            $push: {
              notifications: {
                ride: req.body.rideId,
                senderID: req.body.userId,
                message: "Ride has been accepted",
                type: 'startaccepted',
                from: ride.pickuplocation,
                to: ride.droplocation,
                read: false
              }
            },
          },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        );

        User.findByIdAndUpdate(
          req.body.userId,
          {
            $pull: {
              notifications: {
                ride: req.body.rideId,
                message: `Accept to start your ride`,
              }
            },
          },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        )
      }
    }
  )
});

// Cancel the request the start ride

router.post('/api/ride/cancelstartride', (req, res)=>{
  Ride.findById(
    req.body.rideId,
    (err, ride) => {
      if (err){
        console.log(err);
        res.json({
          code: 200,
          message: "Error canceling Ride"
        })
      }else{
        console.log(ride);
        res.json({
          code: 200,
          message: "Ride Cancelled"
        });
        User.findByIdAndUpdate(
          ride.driverId,
          {
            $push: {
              notifications: {
                ride: req.body.rideId,
                senderID: req.body.userId,
                message: "Ride has been declined",
                type: 'startaccepted',
                from: ride.pickuplocation,
                to: ride.droplocation,
                read: false
              }
            },
          },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        );
        User.findByIdAndUpdate(
          req.body.userId,
          {
            $pull: {
              notifications: {
                ride: req.body.rideId,
                message: `Accept to start your ride`,
              }
            },
          },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        )
      }
    }
  )
})

// Start ride by driver

router.post("/api/ride/startride", (req, res) => {
  Ride.findById(
    req.body.rideId,
    (err, data) => {
    if (!err) {
      var sentNotification = false;
      if (data != null) {
        if (data.passengersID.length == 0){
          res.json({
            code: 300,
            state: false,
            message: "can't start a ride without passenger",
          });
        }else if(data.passengersID.length == data.readyPassengersID.length){
          res.json({
            code: 200,
            state: true,
            message: "All user accepted proceed to ride",
          });text
        }else{
          data.passengersID.forEach((id) => {
            if (!data.readyPassengersID.includes(id)){
              User.findById(
                  id,
                  (err, user) => {
                    if (!err) {

                      console.log(!user.notifications.includes({
                        senderID: req.body.userId,
                        type: 'startrequest',
                        from: data.pickuplocation,
                        to: data.droplocation,
                        ride: req.body.rideId,
                        message: `Accept to start your ride`
                      }));

                      if (user.notifications){
                        if (!user.notifications.includes({
                          senderID: req.body.userId,
                          type: 'startrequest',
                          from: data.pickuplocation,
                          to: data.droplocation,
                          ride: req.body.rideId,
                          message: `Accept to start your ride`
                      })){
                          sentNotification = true;
                          User.findByIdAndUpdate(
                            id,
                            { $push: { notifications: {
                                senderID: req.body.userId,
                                type: 'startrequest',
                                from: data.pickuplocation,
                                to: data.droplocation,
                                ride: req.body.rideId,
                                message: `Accept to start your ride`,
                                read: false
                            }, } },
                            (err, userss) => {
                              if (!err) {
                                console.log('user');
                              } else {
                                console.log(err);
                              }
                            }
                          );
                        }
                      }
                    } else {
                      console.log(err);
                    }
                  }
                );
              }else{
            }
          })
          if (sentNotification){
            res.json({
              code: 302,
              state: false,
              message: "Request to start have been sent",
            });
          }else{
            res.json({
              code: 302,
              state: false,
              message: "Passengers haven't accepted ride",
            });
          }
        }
      } else {
        res.json({
          code: 300,
          state: false,
          message: "Ride not found",
        });
      }
    } else {
      console.log(err);
    }
  });
});


router.post("/api/ride/endride", (req, res) => {
  console.log(req.body);
  Ride.findById(
    req.body.rideId,
    (err, ride) => {
    if (!err) {
      console.log(ride);

      if (ride) {

        User.findOneAndUpdate(
          { _id: req.body.userId },
          { $push: { pastofferedride: req.body.rideId } },
          { $pull: { offeredride: req.body.rideId } },
          { new: true },
          (err, doc) => {
            if (!err) {
              console.log(doc);
            } else {
              console.log(err);
            }
          }
        );

        data.passengersID.forEach((id)=>{
          User.findOneAndUpdate(
            { _id: id },
            { $push: { pastbookedride: req.body.rideId } },
            { $pull: { bookedride: req.body.rideId } },
            { new: true },
            (err, doc) => {
              if (!err) {
                console.log(doc);
                // Wallet.findOneAndUpdate(
                //   {userId: id},
                //   {$inc: {balance: -(ride.ridefare*0.8)}},
                //   (err, result) => {
                //     if (!err) {
                //       // console.log('updating wallet');
                //     }else{
                //       console.log('Error updating wallet');
                //     }
                //   }
                // );
              } else {
                console.log(err);
              }
            }
          );
        });

        Wallet.findOneAndUpdate(
          {userId: req.body.userId},
          {$inc: {balance: -(ride.ridefare*0.2 * data.passengersID.length)}},
          (err, result) => {
            if (!err) {
              console.log('updating wallet');
            }else{
              console.log('Error updating wallet');
            }
          }
        );

        Admin.findOneAndUpdate(
          {},
          {$inc: {totalAmount: +(ride.ridefare*0.2)}},
          () => {
            if (!err) {
              console.log('updating admin');
            }else{
              console.log('Error updating admin');
            }
          }
        );
        
        res.json({
          code: 200,
          message: "Ride has ended successfully",
          deleteRide: data,
        });

        
      }
    } else {
      console.log(err);
    }
  });
});

// PAYMENT

//payment 


router.post('/api/payment/getwalletdetails', (req, res) => {
  Wallet.findOne(
    {userId: req.body.userId},
    (err, result) => {
      if (!err){
        res.json(result);
      }else{
        res.status(400).json('Error getting wallet');
      }
    }
  )
});

router.post('/api/user/sendCredits', (req, res) => {
  console.log(req.body);
  Wallet.findOne(
    {userId: req.body.userId},
    (err, userResult) => {
      if (!err){
        if (userResult.balance > req.body.amountSent) {
          if (req.body.receiverId != '+000000001'){
            Wallet.findOneAndUpdate(
              {uniqueId: req.body.receiverId},
              {
                $inc: {balance: +req.body.amountSent}
              },
              (err, result) => {
                if (!err){
                  if (result){
                    Wallet.findOneAndUpdate(
                      {userId: req.body.userId},
                      {
                        $inc: {balance: -req.body.amountSent}
                      },
                      (err, resultNew) => {
                        if (!err){
                          res.json(resultNew);
                          User.findById(
                            req.body.userId,
                            (err, sender) => {
                              User.findById(
                                result.userId,
                                (err, reciever) => {
                                  Payment.create({
                                    toname: reciever.firstname+" "+reciever.lastname,
                                    fromname: sender.firstname+" "+sender.lastname,
                                    from: sender.phonenumber,
                                    to: reciever.phonenumber,
                                    fromid: sender._id,
                                    toid: reciever._id,
                                    date: new Date(),
                                    amount: req.body.amountSent
                                  }).then((err, payment) => {
                                    console.log('Payment created');
                                  })
                                }
                              );
                            }
                          );
                          
                        }else{
                          res.status(400).json("Error deducing to balance");
                          console.log("invalid");
                        }
                      }
                    )
                  }else{
                    res.status(400).json("This Account Does Not Exist");
                  }
                }else{
                  res.status(400).json("This Account Does Not Exist");
                }
              }
            )
          }else{
            Admin.findOneAndUpdate(
              {},
              {
                $inc: {totalAmount: +req.body.amountSent}
              },
              (err, adminResult) => {
                if (!err){
                  if (adminResult){
                    Wallet.findOneAndUpdate(
                      {userId: req.body.userId},
                      {
                        $inc: {balance: -req.body.amountSent}
                      },
                      (err, resultNew) => {
                        if (!err){
                          res.json(resultNew);
                          User.findById(
                            req.body.userId,
                            (err, sender) => {
                              Payment.create({
                                toname: "Admin",
                                fromname: sender.firstname+" "+sender.lastname,
                                from: sender.phonenumber,
                                to: '000000001',
                                fromid: sender._id,
                                toid: adminResult._id,
                                date: new Date(),
                                amount: req.body.amountSent
                              }).then((err, payment) => {
                                console.log('Payment created');
                              });
                            }
                          );
                          
                        }else{
                          res.status(400).json("Error deducing to balance");
                          console.log("invalid");
                        }
                      }
                    )
                  }else{
                    res.status(400).json("This Account Does Not Exist");
                  }
                }else{
                  res.status(400).json("This Account Does Not Exist");
                }
              }
            )
          }
        }else{
          res.status(400).json("Insufficient Balance");
        }
      }else{
        res.status(400).json("Invalid Data");
      }
    }
  )
});

router.post('/api/payment/getministatements', (req, res) => {
  Payment.find(
    {
      $or: [
        {fromid: req.body.userId},
        {toid: req.body.userId}
      ]
    },
    (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(403);
      }else{
        console.log(data)
        res.status(200).json(data);
      }
    }
  )
})


router.get('/api/payment/getallministatements', authenticateToken, (req, res) => {
  Payment.find(
    {},
    (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(403);
      }else{
        res.status(200).json(data);
      }
    }
  )
})



// ADMIN API

//Admin Signup

var admin = {
  email: "jude@mail.com",
  password: bcrypt.hashSync("J123456", 10),
  createdOn: new Date(),
  lastLogin: new Date()
};

Admin.findOne(
  {
    email: admin.email,
  },
  function (err, result) {
    if (!result) {
      Admin.create(admin)
        .then(
          (user) => {
            console.log("User has been Added ", user);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  }
);


//Admin Login
router.post("/api/admin/login", (req, res) => {
  Admin.findOne({ email: req.body.email}, (err, admin) => {
    console.log("my email" + admin);
    if (admin == null) {
      res.status(400).json("Invalid email");
    } else {
      if (admin && bcrypt.compareSync(req.body.password, admin.password)) {
        const accessToken = jwt.sign(
          {
            email: admin.email,
          },
          ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );
        let response = {};
        response.accessToken = accessToken;
        response.user = admin;
        res.status(200).json(response);
        Admin.findOneAndUpdate(
          { email: req.body.email},
          {$set: {lastlogin: Date().split('+')[0]}},
          (err, admin) => {});
      } else {
        res.status(400).json("Invalid password");
      }
    }
  });
});

//Block User
router.post("/api/admin/blockuser", authenticateToken, (req, res) => {
  User.findByIdAndUpdate(
    req.body.id,
    {
      $set: {blocked: 'blocked'}
    },
    (err, data) => {
      if (!err) {
        res.json('Blocked User Successfully');
      } else {
        res.status(400).json('Blocked User Unsuccessfully');
      }
    }
  );
});

//Unblock User
router.post("/api/admin/unblockuser", authenticateToken, (req, res) => {
  User.findByIdAndUpdate(
    req.body.id,
    {
      $set: {blocked: 'unblocked'}
    },
    (err, data) => {
      if (!err) {
        res.json('Unblocked User Successfully');
      } else {
        res.status(400).json('Unblocked User Unsuccessfully');
      }
    }
  );
});

router.post('/api/admin/sendCredits', (req, res) => {
  Wallet.findOne(
    {uniqueId: req.body.receiverId},
    (err, userResult) => {
      if (!err){
        Wallet.findOneAndUpdate(
          {uniqueId: req.body.receiverId},
          {
            $inc: {balance: +req.body.amountSent}
          },
          (err, result) => {
            if (!err){
              res.json(result);
              console.log(req.body.receiverId);
              Admin.findOne(
                {},
                (err, adminn) => {
                  User.findOne(
                    {phonenumber: req.body.receiverId},
                    (err, reciever) => {
                      if (err) return console.error(err);
                      console.log(reciever);
                      Payment.create({
                        toname: reciever.firstname+" "+reciever.lastname,
                        fromname: "Admin",
                        from: "000000001",
                        to: reciever.phonenumber,
                        fromid: adminn._id,
                        toid: reciever._id,
                        date: Date(),
                        amount: req.body.amountSent
                      }).then((err, payment) => {
                        console.log('Payment created');
                      })
                    });
                }
              );
            }else{
              res.status(400).json("Error adding to balance");
            }
          }
        )
      }else{
        res.status(400).json("Balance is not available");
      }
    }
  )
});


module.exports = router;
