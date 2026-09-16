/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin usa requires dinámicos que el empaquetador rompe. Esto le dice a
  // Next que lo deje afuera del bundle y lo cargue desde node_modules en tiempo de
  // ejecución. Sin esto, la función serverless de Vercel falla al importarlo.
  serverExternalPackages: ['firebase-admin'],


  // Los videos de Community cambian muy de vez en cuando. Sin esto el navegador
  // pregunta al servidor en cada visita (recibe "sin cambios", pero pregunta).
  // Con una semana de caché no pregunta más, y stale-while-revalidate hace que,
  // si reemplazás uno, el cambio se propague sin que nadie espere.
  async headers() {
    return [
      {
        source: '/community/:archivo*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
