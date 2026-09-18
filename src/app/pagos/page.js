import PaginaInstitucional, { metadataDe } from '@/components/PaginaInstitucional';

export const metadata = metadataDe('pagos', '/pagos', 'Medios de pago aceptados en 028 Import: transferencia, efectivo y las opciones disponibles al hacer el pedido.');

export default function Pagina() {
  return <PaginaInstitucional clave="pagos" />;
}
