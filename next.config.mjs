/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    REDIS_URL: process.env.REDIS_URL,
    REDIS_TOKEN: process.env.REDIS_TOKEN,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "serialize-error": false,
    };
    return config;
  },
};

export default nextConfig;
