import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    originalURL: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "expired", "disabled"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

const urlModel = mongoose.models.Url || mongoose.model('Url', urlSchema);

export default urlModel
