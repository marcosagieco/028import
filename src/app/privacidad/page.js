import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('privacidad', '/privacidad', 'Política de privacidad de 028 Import: qué datos pedimos y para qué los usamos.');

export default function Pagina() {
  return <PaginaInstitucional clave="privacidad" />;
}
