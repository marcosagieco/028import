// Lo compartido de los videos de 028 Community: la home los muestra en su sección
// y la ficha de producto, los que tienen que ver con ese producto.

// Pósters de los videos. Los que están en Firebase Storage no traen thumbnail
// propio, así que se sirven desde /public/community: así la portada se ve sin tener
// que descargar el video entero.
const COMMUNITY_POSTERS = {
  hanni:     '/community/hanni.webp',
  martulali: '/community/martulali.webp',
  alelali:   '/community/alelali.webp',
  giulianny: '/community/giulianny.webp',
};

/** La imagen de portada de un video, sin descargar el video. '' si no hay. */
export function posterDeVideo(videoUrl) {
  const url = String(videoUrl || '').trim();
  if (!url) return '';
  // Cloudinary puede generar el frame al vuelo desde la propia URL
  if (url.includes('/video/upload/')) {
    return url
      .replace('/video/upload/', '/video/upload/f_jpg,so_0.6,q_auto/')
      .replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg');
  }
  // Videos propios en /community: el póster es el mismo nombre en .webp,
  // así no hay que mantener ninguna lista aparte.
  if (url.startsWith('/community/')) return url.replace(/\.(mp4|mov|webm)$/i, '.webp');
  // Firebase Storage: se mantiene el mapa por si quedara alguno apuntando ahí.
  const fileName = decodeURIComponent((url.split('/o/')[1] || '').split('?')[0]).toLowerCase();
  const match = Object.keys(COMMUNITY_POSTERS).find(key => fileName.includes(key));
  return match ? COMMUNITY_POSTERS[match] : '';
}

/** Los ids (como texto) de los productos que aparecen en un video. */
export function idsDelVideo(video) {
  return [
    ...(video?.productId ? [video.productId] : []),
    ...(Array.isArray(video?.productsShown) ? video.productsShown : []),
  ]
    .map(id => String(id ?? '').trim())
    .filter(Boolean)
    .filter((id, i, arr) => arr.indexOf(id) === i);
}
