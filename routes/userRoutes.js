import express from "express";
import {
  getAllURL
} from "../controllers/userControllers.js";
import verifyJWT from "../middlewares/jwtverification.js";
import authLimiter from "../middlewares/authorizedLimiter.js";


const router = express.Router();

router.route("/urls").get(verifyJWT, authLimiter, getAllURL);

export default router;