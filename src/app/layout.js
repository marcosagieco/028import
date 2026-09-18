import './globals.css';
import Script from 'next/script';
import { Bebas_Neue, Poppins } from 'next/font/google';
import { CarritoProvider } from '@/components/CarritoProvider';

// next/font descarga las fuentes en el build y las sirve desde tu propio dominio.
// Antes se pedían con un @import adentro de una etiqueta <style>, que es la forma
// más lenta: el navegador tenía que bajar y leer ese CSS para recién enterarse de
// que necesitaba las fuentes, y después salir a buscarlas a otros dos dominios.
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--fuente-bebas' });
const poppins = Poppins({ weight: ['400','500','700','900'], subsets: ['latin'], display: 'swap', variable: '--fuente-poppins' });

const CONFIG = {
  brandName: "028",
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png",
  whatsappNumber: "5491153412358",
};

const SITIO = 'https://028import.com';
const DESCRIPCION = 'Vapes, tecnología y perfumes importados. Envío en 30 minutos por CABA y AMBA, y envíos a todo el país. Productos originales con garantía.';

export const metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: '028 Import | Vapes y tecnología con envío en 30 minutos',
    template: '%s | 028 Import',
  },
  description: DESCRIPCION,
  alternates: {
    canonical: '/',
  },
  // Esto es lo que lee WhatsApp, Instagram y Facebook para armar la vista previa
  // cuando alguien comparte el link. Sin esto, cada app adivina qué imagen usar.
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITIO,
    siteName: '028 Import',
    title: '028 Import | Vapes y tecnología con envío en 30 minutos',
    description: DESCRIPCION,
    images: [{
      url: '/og-028.jpg',
      width: 1200,
      height: 630,
      alt: '028 Import',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '028 Import | Vapes y tecnología con envío en 30 minutos',
    description: DESCRIPCION,
    images: ['/og-028.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Le dice a Google qué tipo de negocio sos, dónde y cómo contactarte. Es lo que
// habilita que aparezca la ficha del comercio en los resultados de búsqueda.
const datosDelNegocio = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: '028 Import',
  description: DESCRIPCION,
  url: SITIO,
  logo: CONFIG.logoImage,
  image: SITIO + '/og-028.jpg',
  telephone: '+' + CONFIG.whatsappNumber,
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Efectivo, Transferencia bancaria',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ciudad Autónoma de Buenos Aires',
    addressRegion: 'CABA',
    addressCountry: 'AR',
  },
  areaServed: [
    { '@type': 'City', name: 'Ciudad Autónoma de Buenos Aires' },
    { '@type': 'AdministrativeArea', name: 'Gran Buenos Aires' },
  ],
  sameAs: [
    'https://www.instagram.com/028.import',
    'https://www.tiktok.com/@028.import',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${bebas.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href={CONFIG.logoImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosDelNegocio) }}
        />
      </head>
      <body className="bg-[#fafafa] text-[#1a1a1a] font-sans flex flex-col relative min-h-screen">
        <div className="noise-overlay" aria-hidden="true" />

        {/* === GOOGLE ANALYTICS === */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZY044XNNSC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZY044XNNSC');
          `}
        </Script>

        {/* === CONTENIDO PRINCIPAL === */}
        {/* Al sacar el <nav> de acá, la ÚNICA barra que va a aparecer es la nueva que armamos en tu página principal */}
        <CarritoProvider>
          <div className="flex-grow">
            {children}
          </div>
        </CarritoProvider>

      </body>
    </html>
  );
}
