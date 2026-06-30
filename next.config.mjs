/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["swisseph"],
  outputFileTracingIncludes: {
    "/api/astrology": ["./node_modules/swisseph/build/Release/swisseph.node"]
  }
};

export default nextConfig;
