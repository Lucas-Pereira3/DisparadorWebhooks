const { createClient } = require('redis');
require('dotenv').config(); 

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
    await redisClient.connect();
    console.log('Redis connected successfully');
};

module.exports = { redisClient, connectRedis };