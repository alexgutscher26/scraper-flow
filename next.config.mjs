/** @type {import('next').NextConfig} */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const ROOT_DIR = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: ROOT_DIR,
  },
  // experimental: {
  //   serverComponentsExternalPackages: ["puppeteer-core"],
  // },
};

export default nextConfig;
