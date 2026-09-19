import urlModel from "../models/urlModel.js";
import userModel from "../models/userModel.js";
import { nanoid } from "nanoid";

export const createURL = async (req, res) => {

  const userId = req.user._id;
  let { originalURL, expirationDuration } = req.body;

  originalURL = originalURL?.trim() || "";

  if (!originalURL || expirationDuration === undefined || expirationDuration === null) {
    return res.status(400).send({ success: false, message: "Original URL and expiration duration are required" });
  }

  const duration = Number(expirationDuration);
  if (isNaN(duration)) {
    return res.status(400).send({ success: false, message: "ExpirationDuration must be a valid number" });
  }

  try {
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).send({ success: false, message: "User does not exist." });
    }

    const expirationTime = new Date(Date.now() + duration);

    const shortCode = nanoid(7);

    const newURL = await urlModel.create({
      originalURL: originalURL,
      slug: shortCode,
      user: userId,
      expiresAt: expirationTime
    });

    return res.status(201).send({
      success: true,
      message: "Short URL created successfully",
      data: newURL
    });

  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

export const redirect = async (req, res) => {

  const slug = req.params.slug;

  try {

    const urlExist = await urlModel.findOne({ slug: slug });

    if (!urlExist) return res.status(404).send({ success: false, message: "Invalid URL" });

    const currentTime = new Date();

    if (urlExist.status === "active" && currentTime > urlExist.expiresAt) {
      urlExist.status = "expired";
      await urlExist.save();
      return res.status(410).send({ success: false, message: "Link has expired" });
    }

    if (urlExist.status === "expired") {
      return res.status(410).send({ success: false, message: "Link has expired" });
    }

    if (urlExist.status === "disabled") {
      return res.status(403).send({ success: false, message: "Link is temporarily deactivated" });
    }

    if (urlExist.status !== "active") {
      return res.status(400).send({ success: false, message: `Link is currently ${urlExist.status}` });
    }

    const originalPath = urlExist.originalURL;

    return res.redirect(302, originalPath);

  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
}

export const getSpecificURL = async (req, res) => {
  const { originalURL } = req.query;
  try {

    const Exist = await urlModel.findOne({ user: req.user._id, originalURL: originalURL });

    if (!Exist) return res.status(400).send({ success: false, message: `The URL "${originalURL}" does not exist for this user.` });

    const slug = Exist.slug;
    const status = Exist.status;

    return res.status(200).json({ originalURL: originalURL, slug: slug, status: status });

  } catch (err) {

    res.status(500).send({ success: false, message: err.message });
  }
}

export const deleteSpecificURL = async (req, res) => {
  const { slug } = req.params;
  try {

    const Exist = await urlModel.findOne({ user: req.user._id, slug: slug });

    if (!Exist) return res.status(400).send({ success: false, message: `The URL for slug "${slug}" does not exist for this user.` });

    await Exist.deleteOne({ slug: slug });

    return res.status(200).json({ success: true, message: `The URL associated with ${slug} has now been deleted.` });

  } catch (err) {

    res.status(500).send({ success: false, message: err.message });
  }
}
