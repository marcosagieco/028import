import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('arrepentimiento', '/arrepentimiento', 'Botón de arrepentimiento de 028 Import: cómo cancelar una compra según la ley de defensa del consumidor.');

export default function Pagina() {
  return <PaginaInstitucional clave="arrepentimiento" />;
}
