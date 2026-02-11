import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GIT_COMMIT: (() => {
      try {
        const { execSync } = require('child_process');
        return execSync('git rev-parse --short HEAD').toString().trim();
      } catch (e) {
        return 'unknown';
      }
    })(),
    NEXT_PUBLIC_DEPLOY_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
