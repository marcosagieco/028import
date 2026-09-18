import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('nosotros', '/nosotros', 'Conocé 028 Import: importación y distribución de vapes, tecnología Apple y perfumes árabes, con entrega en 30 minutos por CABA y AMBA.');

export default function Pagina() {
  return <PaginaInstitucional clave="nosotros" />;
}
