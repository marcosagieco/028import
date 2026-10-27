import { redirect } from 'next/navigation';

// Link corto para pedir reseñas: 028import.com/resenas lleva directo a
// "Lo que dicen de nosotros" en la home.
export default function Resenas() {
  redirect('/#opiniones');
}
