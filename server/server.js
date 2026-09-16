import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "../routes/authRoutes.js";
import urlRoutes from "../routes/urlRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import connectDB from "../configs/db.js";
import publicLimiter from "../middlewares/publicLimiter.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

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

app.post("/api/debug", (req, res) => {
  console.log("DEBUG BODY:", req.body);

  res.json({
    body: req.body
  });
});

connectDB();

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on PORT ${PORT}`);
});

export default app;
