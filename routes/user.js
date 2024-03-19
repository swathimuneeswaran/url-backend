import express from "express";
import bcrypt from "bcrypt";
const router = express.Router();
import { User } from "../models/User.js";
import { UrlModel } from "../models/url.js";
// import bodyParser from "body-parser"
import jwt from "jsonwebtoken";
// import dotenv from "dotenv"
// dotenv.config()
import nodemailer from "nodemailer";

// router.use(bodyParser,urlencoded({extended:true}))

router.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  const user = await User.findOne({ email });
  console.log(firstname, lastname, email, password)
  if (user) {
    return res.json({ message: "User already exist" });
  }
  const hashpassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    firstname,
    lastname,
    email,
    password: hashpassword,
  });
  await newUser.save();
  return res.json({
    status: true,
    message: "Record registered Successfully",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email)
  let user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send({
      message: "User Does Not Exists",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send({
      message: "Incorrect Password",
    });
  }

  const token = jwt.sign({ firstname: user.firstname }, process.env.KEY, {
    expiresIn: "1hr",
  });
  res.cookie("token", token, { httpOnly: true, maxAge: 360000 });
  return res.json({ status: true, message: "Login Successful" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "User does not exist.Please create an Account!!",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.KEY, {
      expiresIn: "10m",
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "swathirajan255@gmail.com",
        pass: "ibcz vplj hwqw urvc",
      },
    });

    var mailOptions = {
      from: "swathirajan255@gmail.com",
      to: email,
      subject: "Reset Password",
      text: `http://localhost:5173/resetPassword/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent:", info.response);
        return res.json({ status: true, message: "Email sent successfully" });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  try {
    const decoded = await jwt.verify(token, process.env.KEY);
    const id = decoded.id;
    const hashpassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate({ _id: id }, { password: hashpassword });
    return res.json({ status: true, message: "Password Updated Successfully" });
  } catch (error) {
    return res.json("Invalid Token");
  }
});

router.post("/url-shortener", async (req, res) => {
  try {
    const urlShort = new UrlModel({
      longUrl: req.body.longUrl,
      shortUrl: generateUrl(), // assuming this function generates a unique shortUrl
    });
    // console.log(urlShort.shortUrl);

    const existingDocument = await UrlModel.findOne({
      longUrl: req.body.longUrl,
    });

    if (existingDocument) {
      console.log("Document with the same longUrl already exists.");
      // res.status(409).json({ error: "A document with the same longUrl already exists." });
    } else {
      const savedUrl = await urlShort.save();
      // console.log(savedUrl);
      res.status(201).json({ url: savedUrl });
    }
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "An error occurred while saving the URL." });
  }
});

router.get("/url-shortener", async (req, res) => {
  try {
    const allUrl = await UrlModel.find();
    res.json({
      urlResult: allUrl,
      message: "Urls fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the URLs." });
  }
});

function generateUrl() {
  var rndResult = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;

  for (var i = 0; i < 5; i++) {
    rndResult += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }

  return rndResult;
}

router.get("/api/:urlId", async (req, res) => {
  try {
    const urlShort = await UrlModel.findOne({ shortUrl: req.params.urlId });
    if (!urlShort) {
      return res.status(404).send("Short URL not found");
    }

    const longUrl = urlShort.longUrl;
    await UrlModel.findByIdAndUpdate(
      { _id: urlShort.id },
      { $inc: { clickCount: 1 } }
    );
    return res.json({ redirectUrl: longUrl });
  } catch (err) {
    return res.status(500).send("Error finding short URL");
  }
});

router.delete("/api/delete/:_id", async (req, res) => {
    try {
      await UrlModel.findByIdAndDelete(req.params._id);
      // console.log(req.params._id);
      return res.send({
        message: "deleted",
        id: req.params._id,
      });
    
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: "Error deleting record",
        error: error.message,
      });
    }
  });

export { router as UserRouter };
