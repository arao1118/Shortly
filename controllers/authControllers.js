import userModel from "../models/userModel.js";
import urlModel from "../models/urlModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../configs/nodemailer.js";

const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required."
      });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required."
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty."
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30m"
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60 * 1000
    });

    console.log(req.cookies);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      userInfo: {
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

const generateOTP = async (req, res) => {

  let { email } = req.body;

  try {

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    email = email.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty."
      });
    }

    const context = req.originalUrl.includes("forgot-password")
      ? "RESET"
      : "VERIFICATION";

    const userExist = await userModel.findOne({ email });

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID."
      });
    }

    if (context === "VERIFICATION" && userExist.verified) {
      return res.status(400).json({
        success: false,
        message: "Your account is already verified."
      });
    }

    const OTP = Math.floor(
      100000 + Math.random() * 900000
    );

    userExist.otp = OTP;
    userExist.otpContext = context;
    userExist.otpExpiredAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await userExist.save();

    if (context === "RESET") {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `The OTP to reset your password is ${OTP}. It expires in 5 minutes.`
      });
    } else {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Email Verification OTP",
        text: `The OTP to verify your account is ${OTP}. It expires in 5 minutes.`
      });
    }

    console.log("Email has been sent.");

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your registered email account."
    });

  } catch (err) {
    console.error("GENERATE OTP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    let { email, otp, OTP } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    email = email.trim().toLowerCase();

    const submittedOTP = Number(otp ?? OTP);

    if (!Number.isInteger(submittedOTP)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    const userExist = await userModel.findOne({ email });

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID."
      });
    }

    if (userExist.otpContext !== "VERIFICATION") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP for email verification."
      });
    }

    if (
      !userExist.otp ||
      !userExist.otpExpiredAt ||
      new Date() > userExist.otpExpiredAt
    ) {
      userExist.otp = null;
      userExist.otpExpiredAt = null;
      userExist.otpContext = "";

      await userExist.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    if (submittedOTP !== userExist.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    userExist.verified = true;
    userExist.verifiedAt = new Date();
    userExist.otp = null;
    userExist.otpExpiredAt = null;
    userExist.otpContext = "";

    await userExist.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userExist.email,
      subject: "Account Verified Successfully",
      text: "Congratulations! Your account has now been verified. You can continue using our service."
    });

    return res.status(200).json({
      success: true,
      message: "Account verification successful."
    });

  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required."
      });
    }

    email = email.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required."
      });
    }

    const userExist = await userModel.findOne({ email });

    if (!userExist) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (!userExist.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in."
      });
    }

    const isMatched = await bcrypt.compare(
      password,
      userExist.password
    );

    if (!isMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      {
        _id: userExist._id,
        name: userExist.name,
        email: userExist.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30m"
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      userInfo: {
        _id: userExist._id,
        name: userExist.name,
        email: userExist.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

const logout = async (_, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    let { email, otp, OTP, newPassword } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    if (
      !newPassword ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    email = email.trim().toLowerCase();

    const submittedOTP = Number(otp ?? OTP);

    if (!Number.isInteger(submittedOTP)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    const userExist = await userModel.findOne({ email });

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID."
      });
    }

    if (userExist.otpContext !== "RESET") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP for password reset."
      });
    }

    if (
      !userExist.otp ||
      !userExist.otpExpiredAt ||
      new Date() > userExist.otpExpiredAt
    ) {
      userExist.otp = null;
      userExist.otpExpiredAt = null;
      userExist.otpContext = "";

      await userExist.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    if (submittedOTP !== userExist.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    userExist.password = await bcrypt.hash(newPassword, 12);
    userExist.otp = null;
    userExist.otpExpiredAt = null;
    userExist.otpContext = "";

    await userExist.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userExist.email,
      subject: "Security Notification: Password Changed",
      text: "Your account password was successfully changed. If you did not make this change, please contact support immediately."
    });
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
      });

    } catch (err) {
      console.error("LOGOUT ERROR:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now log in."
    });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteUser = async (req, res) => {
  let { email, password } = req.body;
  email = email.trim().toLowerCase();
  if (!email) return res.status(400).send({ success: false, message: " Email id required" });
  if (!password) return res.status(400).send({ success: false, message: " password required" });

  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId);
    if (!user) res.status(400).send({ success: false, message: "User not found." });

    if (user.email != email) res.status(400).send({ success: false, message: "Email does not match logged in account" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) res.status(400).send({ success: false, message: "Wrong Password." });

    await userModel.findByIdAndDelete(userId);
    await urlModel.deleteMany({ user: userId });

    res.clearCookie('token');

    return res.status(200).send({ success: true, message: "User successfully deleted." });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
}

export default {
  register,
  generateOTP,
  verifyEmail,
  login,
  logout,
  resetPassword,
  deleteUser
};
