/*
  GENERADOR DE ICONOS  —  src/app/iconos.css
  ==========================================

  ¿Cuándo hay que correr esto?
  Cada vez que agregues un ícono nuevo que antes no se usaba. Por ejemplo si
  escribís <i className="fas fa-rocket"> y "fa-rocket" no estaba en el proyecto.

      cd 028-import-oficial
      node generar-iconos.mjs

  ¿Por qué existe?
  El sitio ya no carga Font Awesome completo (eran 226 KB de tipografías desde un
  servidor ajeno, que además frenaban el dibujado de la página). En su lugar se
  genera un CSS con SOLO los íconos que el proyecto usa. Las clases son las mismas
  de siempre (fas / far / fab + fa-nombre), así que el HTML no cambia en nada.

  Si agregás un ícono y NO corrés esto, ese ícono no se va a ver (queda un hueco).
  Al final el script avisa cuántos encontró.

  Íconos: Font Awesome Free 6.0.0 — licencia CC BY 4.0
  https://fontawesome.com/license/free
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

// fileURLToPath y no import.meta.url a mano: la ruta del proyecto tiene espacios
// y salen codificados como %20, que después no existe como carpeta.
const RAIZ = path.dirname(fileURLToPath(import.meta.url)) + path.sep;
const CARPETAS = { fas: 'solid', far: 'regular', fab: 'brands' };

// Font Awesome 6 renombró varios íconos de la versión 5. Las clases viejas siguen
// andando como alias, pero el archivo SVG está guardado con el nombre nuevo.
const RENOMBRES = {
  'university': 'building-columns', 'shopping-bag': 'bag-shopping', 'undo': 'arrow-rotate-left',
  'question-circle': 'circle-question', 'home': 'house', 'sliders-h': 'sliders',
  'times': 'xmark', 'shield-alt': 'shield', 'mobile-alt': 'mobile-screen-button',
  'shopping-cart': 'cart-shopping', 'trash-alt': 'trash-can', 'ticket-alt': 'ticket-simple',
  'check-circle': 'circle-check', 'map-marked-alt': 'map-location-dot',
  'map-marker-alt': 'location-dot', 'calendar-alt': 'calendar-days',
  'mouse-pointer': 'arrow-pointer', 'arrows-alt-h': 'left-right',
  'th-large': 'table-cells-large', 'info-circle': 'circle-info',
  'magic': 'wand-magic-sparkles', 'pencil-alt': 'pencil', 'edit': 'pen-to-square',
  'save': 'floppy-disk', 'sign-out-alt': 'right-from-bracket',
  'external-link-alt': 'up-right-from-square', 'sync-alt': 'rotate',
  'redo': 'arrow-rotate-right', 'cog': 'gear', 'cogs': 'gears',
  'tachometer-alt': 'gauge-high',
};

// Clases utilitarias de Font Awesome: no son íconos.
const NO_SON_ICONOS = new Set([
  'spin', 'pulse', 'fw', 'border', 'pull-left', 'pull-right', 'stack', 'stack-1x',
  'stack-2x', 'inverse', 'flip', 'rotate', '2x', '3x', '4x', '5x', 'lg', 'sm', 'xs',
]);

const ARCHIVOS = [
  'src/app/HomeClient.jsx', 'src/app/admin/page.js', 'src/app/nosotros/page.js',
  'src/app/envios/page.js', 'src/components/CalculadorEnvio.js',
  'src/components/CalculadorEnvioSimple.js', 'src/components/VapeSpecs3D.jsx',
];

const usados = new Map();
const sumar = (estilo, nombre) => usados.set(estilo + ' ' + nombre, { estilo, nombre });

// Barrido amplio a propósito: el proyecto escribe los íconos de varias formas y
// si se busca una sola, alguno queda afuera y desaparece sin avisar.
//   className="fas fa-star"            prefijo pegado al nombre
//   { id: 'fa-star', prefix: 'fas' }   campos separados (los del panel)
//   { icon: 'fa-list' }                suelto, el prefijo se pone en otro lado
//   cond ? 'fa-eye' : 'fa-eye-slash'   elegido en tiempo real
// Cuando no se sabe el estilo se prueban los tres; el que no exista se descarta.
const sueltos = new Set();
for (const archivo of ARCHIVOS) {
  const ruta = RAIZ + archivo;
  if (!fs.existsSync(ruta)) continue;
  const texto = fs.readFileSync(ruta, 'utf8');

  for (const m of texto.matchAll(/\b(fas|far|fab)\s+fa-([a-z0-9-]+)/g)) {
    if (!m[2].endsWith('-') && !NO_SON_ICONOS.has(m[2])) sumar(m[1], m[2]);
  }
  for (const m of texto.matchAll(/fa-([a-z0-9-]+)/g)) {
    if (!m[1].endsWith('-') && !NO_SON_ICONOS.has(m[1])) sueltos.add(m[1]);
  }
}
for (const n of sueltos) { sumar('fas', n); sumar('fab', n); sumar('far', n); }

// Estos se arman en tiempo de ejecución: fa-chevron-${'up' | 'down'}
sumar('fas', 'chevron-up');
sumar('fas', 'chevron-down');

const reglas = [];
for (const [, { estilo, nombre }] of [...usados].sort()) {
  const archivo = RENOMBRES[nombre] || nombre;
  const url = `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.0.0/svgs/${CARPETAS[estilo]}/${archivo}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) continue;   // no existe en ese estilo: se descarta en silencio
    let svg = (await res.text()).replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!svg.includes('fill=')) svg = svg.replace('<svg', '<svg fill="currentColor"');

    // El viewBox da la proporción. Font Awesome dibuja íconos de distinto ancho;
    // sin esto quedan todos cuadrados y algunos se ven achatados.
    const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const razon = vb ? Number(vb[1]) / Number(vb[2]) : 1;

    const datos = 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
    reglas.push(`.${estilo}.fa-${nombre}{-webkit-mask-image:url("${datos}");mask-image:url("${datos}");width:${razon.toFixed(4)}em}`);
  } catch { /* sin conexión o ícono inexistente: se descarta */ }
}

const cabecera = `/* GENERADO POR generar-iconos.mjs — NO EDITAR A MANO.
   Contiene solo los ${reglas.length} íconos que el proyecto usa. Reemplaza a Font Awesome
   completo, que traía 226 KB de tipografías desde un servidor ajeno con una hoja de
   estilos que frenaba el dibujado. Las clases son las mismas (fas/far/fab + fa-nombre).

   Si agregás un ícono nuevo al código, volvé a correr:  node generar-iconos.mjs

   Íconos: Font Awesome Free 6.0.0, CC BY 4.0 — https://fontawesome.com/license/free */

.fas, .far, .fab {
  display: inline-block;
  height: 1em;
  width: 1em;
  background-color: currentColor;
  vertical-align: -0.125em;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-size: contain;
          mask-size: contain;
}

/* Animación que traía Font Awesome y el proyecto usa en "Procesando..." */
@keyframes fa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.fa-spin { animation: fa-spin 2s linear infinite; }
@media (prefers-reduced-motion: reduce) { .fa-spin { animation: none; } }

`;

fs.writeFileSync(RAIZ + 'src/app/iconos.css', cabecera + reglas.join('\n') + '\n');
console.log(`Listo: ${reglas.length} íconos escritos en src/app/iconos.css`);
