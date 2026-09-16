import { createClient } from "redis";
import "dotenv/config";

const client = createClient({
  url: process.env.REDIS_URI
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected!'));

await client.connect();

export default client;
