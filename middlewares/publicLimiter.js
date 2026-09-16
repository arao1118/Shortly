import client from "../configs/redis.js"

export const publicLimiter = async (req, res, next) => {

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const key = `publicRate_limit:user:${ip}`;

  const MAX_REQUEST = 10;
  const REFILL_RATE_PER_MS = 0.01;
  try {

    const hasSentRequest = await client.hExists(key, 'token_size');
    const currentTimeStamp = Date.now();

    if (!hasSentRequest) {
      await client.hSet(key, {
        token_size: (MAX_REQUEST - 1).toString(),
        last_updated: currentTimeStamp.toString()
      });
      console.log(`New user ${ip} arrived.`);
      return next();
    }

    let current_tokens = Number(await client.hGet(key, "token_size"));
    let last_updated = Number(await client.hGet(key, "last_updated"));

    //let current_tokens = Number(availableTokensStr);
    //const last_updated = Number(lastUpdatedStr);

    const timePassedMs = currentTimeStamp - last_updated;
    const tokensToRefill = timePassedMs * REFILL_RATE_PER_MS;

    let refilled_tokens = Math.min(MAX_REQUEST, current_tokens + tokensToRefill);

    if (current_tokens >= 1) {
      refilled_tokens -= 1;

      await client.hSet(key, {
        token_size: refilled_tokens.toString(),
        last_updated: currentTimeStamp.toString()
      });
      console.log(`User ${ip} made request at ${last_updated} and he has ${current_tokens} tokens remaining.`);
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

export default publicLimiter;
