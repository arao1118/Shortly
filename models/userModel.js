import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    verified: {
      type: Boolean,
      default: false
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    otp: {
      type: Number,
      default: null
    },

    otpContext: {
      type: String,
      enum: ["", "VERIFICATION", "RESET"],
      default: ""
    },

    otpExpiredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const userModel = mongoose.model("User", userSchema);

export default userModel;
