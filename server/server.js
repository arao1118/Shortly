import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "../routes/authRoutes.js";
import urlRoutes from "../routes/urlRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import connectDB from "../configs/db.js";
import publicLimiter from "../middlewares/publicLimiter.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/user", userRoutes);

app.use((req, _, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

app.get("/api/test", publicLimiter, (_, res) => {
  res.json({
    success: true,
    message: "Request accepted",
  });
});

//app.use(express.static(distDir));
//
//app.use((req, res, next) => {
//  if (req.method === "GET" && !req.path.startsWith("/api/")) {
//    return res.sendFile(path.join(distDir, "index.html"), (err) => {
//      if (err) next(err);
//    });
//  }
//  next();
//});

connectDB();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});

export default app;
