import urlModel from "../models/urlModel.js";

export const getAllURL = async (req, res) => {

  const { page, page_size } = req.query;
  try {

    const userData = await urlModel.find({ user: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * page_size).limit(page_size);

    if (!userData || userData.length === 0) return res.status(400).send({ message: false, message: `User has not created any short links` });

    return res.status(200).json(userData);

  } catch (err) {

    res.status(500).send({ success: false, message: err.message });
  }
}
