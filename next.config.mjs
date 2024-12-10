/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "serialize-error": false,
    };
    return config;
  },
};

export default nextConfig;
