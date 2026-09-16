import client from "../configs/redis.js"

export const authLimiter = async (req, res, next) => {

  const userID = req.user._id.toString();
  const key = `rate_limit:user:${userID}`;

  const MAX_REQUEST = 5;
  const REFILL_RATE_PER_MS = 0;
  try {

    const exist = await client.hExists(key, 'token_size');
    const currentTimeStamp = Date.now();

    if (!exist) {
      await client.hSet(key, {
        token_size: (MAX_REQUEST - 1).toString(),
        last_updated: currentTimeStamp.toString()
      });
      return next();
    }

    const availableTokensStr = await client.hGet(key, "token_size");
    const lastUpdatedStr = await client.hGet(key, "last_updated");

    let current_tokens = Number(availableTokensStr);
    const last_updated = Number(lastUpdatedStr);

    const timePassedMs = currentTimeStamp - last_updated;
    const tokensToRefill = timePassedMs * REFILL_RATE_PER_MS;

    let refilled_tokens = Math.min(MAX_REQUEST, current_tokens + tokensToRefill);

    if (refilled_tokens >= 1) {
      refilled_tokens -= 1;

      await client.hSet(key, {
        token_size: refilled_tokens.toString(),
        last_updated: currentTimeStamp.toString()
      });
      return next();
    } else {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Rate limit exceeded."
      });
    }


  } catch (err) {
    res.status(500).send({ succes: false, message: err.message });
  }
}

export default authLimiter;