/** @type {import('next').NextConfig} */

// Secret mount path. The whole inventory app lives under this prefix so it is
// only reachable by someone who knows the full URL. Keep in sync with the
// proxy prefix in ../server.js.
const BASE_PATH = '/testserver/customerid/c64fc823/root/3a8021/tracker';

const nextConfig = {
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
