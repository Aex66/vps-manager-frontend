/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages (static upload): emit HTML/JS/CSS into `out/`
  output: "export",
  allowedDevOrigins: ["192.168.101.6"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
