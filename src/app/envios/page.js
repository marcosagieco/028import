import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('envios', '/envios', 'Cómo son los envíos de 028 Import: entrega en 30 minutos por CABA y AMBA, y despachos al resto del país.');

export default function Pagina() {
  return <PaginaInstitucional clave="envios" />;
}
