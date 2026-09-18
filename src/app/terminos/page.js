import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('terminos', '/terminos', 'Términos y condiciones de uso y compra en 028 Import.');

export default function Pagina() {
  return <PaginaInstitucional clave="terminos" />;
}
