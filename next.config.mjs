/** @type {import('next').NextConfig} */
const nextConfig = {
  // `output: "export"` is incompatible with middleware + Route Handlers (cookie session,
  // /api/auth/*). Deploy with `next start`, Docker, Vercel, etc., or a static host that
  // runs Next as a server (not a plain `out/` upload).
  allowedDevOrigins: ["192.168.101.4"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
