import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The old résumé page pointed at a .docx that no longer exists; send people to the PDF.
      { source: "/resume", destination: "/Keaton%20Jones%20Resume.pdf", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:dir(apps|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
