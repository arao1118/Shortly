import express from "express";
import {
  createURL,
  redirect,
  getSpecificURL,
  deleteSpecificURL
} from "../controllers/urlControllers.js";
import verifyJWT from "../middlewares/jwtverification.js";
import authLimiter from "../middlewares/authorizedLimiter.js";
import publicLimiter from "../middlewares/publicLimiter.js";

const router = express.Router();

router.route("/:slug")
  .get(publicLimiter, redirect)
  .delete(verifyJWT, authLimiter, deleteSpecificURL);

// Protected Routers
router.route("")
  .post(verifyJWT, authLimiter, createURL)
  .get(verifyJWT, authLimiter, getSpecificURL);


export default router;
