import client from "../configs/redis.js";

export const publicLimiter = async (req, res, next) => {

  const userId = req.user._id;

  const key = `authRate_limit:user:${userId}`;

  const MAX_REQUEST = 10;
  const REFILL_RATE_PER_MS = 0.005;

  try {

    const hasSentRequest = await client.hExists(key, "token_size");
    const currentTimeStamp = Date.now();

    if (!hasSentRequest) {

      await client.hSet(key, {
        token_size: (MAX_REQUEST - 1).toString(),
        last_updated: currentTimeStamp.toString()
      });

      return next();
    }

    let current_tokens = Number(
      await client.hGet(key, "token_size")
    );

    let last_updated = Number(
      await client.hGet(key, "last_updated")
    );

    const timePassedMs = currentTimeStamp - last_updated;

    const tokensToRefill =
      timePassedMs * REFILL_RATE_PER_MS;

    let refilled_tokens = Math.min(
      MAX_REQUEST,
      current_tokens + tokensToRefill
    );

    if (refilled_tokens >= 1) {

      refilled_tokens -= 1;

      await client.hSet(key, {
        token_size: refilled_tokens.toString(),
        last_updated: currentTimeStamp.toString()
      });

      return next();

    } else {

      await client.hSet(key, {
        token_size: refilled_tokens.toString(),
        last_updated: currentTimeStamp.toString()
      });

      return res.status(429).json({
        success: false,
        message: "Too many requests. Rate limit exceeded."
      });
    }

  } catch (err) {

    console.error("RATE LIMITER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export default publicLimiter;
