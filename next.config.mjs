/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin usa requires dinámicos que el empaquetador rompe. Esto le dice a
  // Next que lo deje afuera del bundle y lo cargue desde node_modules en tiempo de
  // ejecución. Sin esto, la función serverless de Vercel falla al importarlo.
  serverExternalPackages: ['firebase-admin'],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
