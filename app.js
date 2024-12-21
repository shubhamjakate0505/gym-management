require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("./models/User");
const Attendance = require("./models/attendance");
const Subscription = require("./models/subscription");
const app = express();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create-order", async (req, res) => {
  const options = {
    amount: 5000,
    currency: "INR",
    receipt: "receipt#1",
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating Razorpay order");
  }
});

app.get("/test-razorpay", (req, res) => {
  res.json({
    key_id: razorpay.key_id,
    key_secret: razorpay.key_secret ? "Loaded" : "Not Loaded",
  });
});

app.post("/payment-success", async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).send("Invalid payment signature.");
    }
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found");
    }

    let subscription = await Subscription.findOne({ user: user._id });

    if (!subscription) {
      subscription = new Subscription({
        user: user._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      });
    } else {
      subscription.isActive = true;
      subscription.endDate = new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      );
    }
    await subscription.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error handling payment success:", error);
    res.status(500).send("Payment failed. Please contact support.");
  }
});

app.get("/dashboard", async (req, res) => {
  const user = await User.findOne({ email: "shubham@gmail.com" }); 
  res.render("dashboard", { user });
});
app.get("/attendance-form", async (req, res) => {
  try {
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found.");
    }

   
    res.render("attendance", { user });
  } catch (error) {
    console.error("Error loading attendance form:", error);
    res.status(500).send("Something went wrong. Please try again later.");
  }
});
app.post("/mark-attendance", async (req, res) => {
  try {
    const { status } = req.body; 
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found.");
    }

   
    const attendance = new Attendance({
      user: user._id,
      status: status,
    });
    await attendance.save();

   
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error marking attendance:", error);
    res
      .status(500)
      .send("Something went wrong while marking attendance. Please try again.");
  }
});

app.post("/renew-subscription", async (req, res) => {
  try {
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found.");
    }
    let subscription = await Subscription.findOne({ user: user._id });
    if (!subscription) {
      subscription = new Subscription({
        user: user._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      });
    } else {
      subscription.isActive = true;
      subscription.endDate = new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      );
    } 
    await subscription.save();  
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res
      .status(500)
      .send(
        "Something went wrong while renewing the subscription. Please try again."
      );
  }
});

app.get("/attendance-form", async (req, res) => {
  try {
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.render("attendance-form", { user });
  } catch (error) {
    console.error("Error loading attendance form:", error);
    res.status(500).send("Something went wrong. Please try again later.");
  }
});

app.post("/mark-attendance", async (req, res) => {
  try {
    const user = await User.findOne({ email: "shubham@gmail.com" });
    if (!user) {
      return res.status(404).send("User not found.");
    }
    const attendance = new Attendance({ user: user._id, status: "present" });
    await attendance.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error marking attendance:", error);
    res
      .status(500)
      .send("Something went wrong while marking attendance. Please try again.");
  }
});

app.listen(8080, () => {
  console.log("runing on port 8080");
});
