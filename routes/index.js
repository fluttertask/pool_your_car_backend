const express = require("express");
const path = require("path");
const { Ride } = require("../models/ride");
const { User } = require("../models/user");
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

module.exports.authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.sendStatus(401);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next(req, res);
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
        }
      }
    );
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
        }

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
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(user);
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
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
          { $pull: { offeredride: req.params.id } },
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
      console.log(data.passengersID);

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

//Accept ride request from the passenger by the Driver

router.post('/api/ride/acceptbookedride', (req, res)=>{
  console.log(req.body);
  Ride.findByIdAndUpdate(
    req.body.rideId,
    {
      $push: {passengersID: req.body.passengerID},
      $pull: {requestedpassengers: req.body.passengerID},
      $inc: { availableseats: -1}
    },
    (err, ride) => {
      if (err){
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
        User.findByIdAndUpdate(
          req.body.userId,
          {
            $pull: {
              Notification: {
                senderID: req.body.userId,
                ride: req.params.id,
                read: false
              }
            },
          }
        )
      }
    }
  )
})

//Reject ride request from the passenger by the Driver

router.post('/api/ride/rejectbookedride', (req, res)=>{
  Ride.findById(
    req.body.id,
    (ridee)=>{
      Ride.findByIdAndUpdate(
        req.body.id,
        
        {
          $push: {passengersID: req.body.passengerID},
          $pull: {requestedpassengers: req.body.passengerID},
        },
        (err, ride) => {
          if (err){
            console.log(err);
            res.json({
              code: 200,
              message: "Error In Rejecting Ride"
            })
          }else{
            console.log(ride);
            User.findByIdAndUpdate(
              req.body.userId,
              {
                $pull: {
                  Notification: {
                    senderID: req.body.userId,
                    ride: req.body.id,
                    message: "Ride has been rejected"
                  }
                },
              }
            )
            res.json({
              code: 200,
              message: "Ride Rejected"
            })
          }
        }
      )
    }
  )
})

// Book ride api

router.post("/api/ride/bookride/:id", (req, res) => {
  console.log(req.body);
  Ride.findByIdAndUpdate(
    req.params.id, 
    {
      $push: {requestedPassengers: req.body.userId},
    },
    {new: true},
    (err, data) => {
    if (!err) {
      // console.log(data);

      if (data != null) {

        User.findOneAndUpdate(
          { _id: req.body.userId },
          { $push: { bookedride: req.params.id } },
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
        res.json({
          code: 200,
          message: "Ride booked successfully",
          passengers: data.passengersID,
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


//cancel booked ride api

router.post("/api/ride/cancelbookedride/:id", (req, res) => {
  Ride.findByIdAndUpdate(
    req.params.id, 
    {
      $pull: {requestedPassengers: req.body.userId},
      $inc: { availableseats: +1}
    },
    {new: true},
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
        ),
          res.json({
            code: 200,
            message: "Booked ride has been removed successfully",
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
});


// accept ride to start journey by driver

router.post('/api/ride/acceptstartride', (req, res)=>{
  Ride.findOneAndUpdate(
    {
      _id: req.body.id,
      passengerID: {
        $elementMatch: {
          type: req.body.userId
        }
      }
    },
    {
      $set: {"passengerID.$.acceptStarting": true},
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
          req.body.driverId,
          {
            $push: {
              Notification: {
                ride: req.body.id,
                message: "Ride has been accepted"
              }
            },
          }
        )
      }
    }
  )
})

// Start ride by driver

router.post("/api/ride/startride/:id", (req, res) => {
  Ride.findById(
    req.params.id,
    (err, data) => {
    if (!err) {
      console.log(data);

      if (data != null) {
        User.updateMany(
          { _id: {$in: data.passengersID}},
          { $push: { notifications: {
              senderID: req.body.userId,
              type: 'bookrequest',
              from: data.pickuplocation,
              to: data.droplocation,
              ride: req.params.id,
              message: `Accept to start your ride`,
              read: false
          }, } },
          (err, user) => {
            if (!err) {
              console.log(user);
            } else {
              console.log(err);
            }
          }
        );
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


module.exports = router;
