import express from "express";
import authControllers from "../controllers/authControllers.js";
import verifyJWT from "../middlewares/jwtverification.js"


const router = express.Router();
const { register, generateOTP, verifyEmail, login, logout, resetPassword, deleteUser } = authControllers;

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/verify").post(generateOTP);
router.route("/verify").put(verifyEmail);
router.route("/forgot-password").post(generateOTP);
router.route("/reset-password").patch(resetPassword);
router.route("/delete-user").delete(verifyJWT, deleteUser);

export default router;