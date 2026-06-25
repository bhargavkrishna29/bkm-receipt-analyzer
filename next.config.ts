import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning when project is nested inside OneDrive
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
