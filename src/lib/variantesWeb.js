import sharp from 'sharp';
import { getBucket } from '@/lib/bucket';
import { ANCHOS_WEB, partesDeFoto, rutaWeb } from '@/lib/imagenWeb';

// Crea en el bucket las versiones WebP que le falten a una foto (ver imagenWeb.js).
// Si ya están, no hace nada: se puede llamar todas las veces que haga falta.

/** Las versiones de un archivo ya leído. */
export async function crearVariantes(bucket, sinExtension, original) {
  for (const ancho of ANCHOS_WEB) {
    const buffer = await sharp(original)
      .resize({ width: ancho, height: ancho, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer();
    const archivo = bucket.file(rutaWeb(sinExtension, ancho));
    await archivo.save(buffer, {
      metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
    });
    await archivo.makePublic();
  }
}

/** Revisa cada link y genera lo que falte. Ignora links que no sean del bucket. */
export async function asegurarVariantes(urls) {
  const bucket = getBucket();
  const unicas = [...new Set(urls)].map(partesDeFoto).filter(p => p && p.bucket === bucket.name);
  for (const { ruta, sinExtension } of unicas) {
    try {
      const anchoMayor = ANCHOS_WEB[ANCHOS_WEB.length - 1];
      const [existe] = await bucket.file(rutaWeb(sinExtension, anchoMayor)).exists();
      if (existe) continue;
      const [original] = await bucket.file(ruta).download();
      await crearVariantes(bucket, sinExtension, original);
    } catch (err) {
      console.error('[variantesWeb] no se pudo preparar', ruta, err?.message);
    }
  }
}

/** Todos los links de foto que aparezcan en un documento, en cualquier campo. */
export function linksDeFotos(valor, acumulado = []) {
  if (typeof valor === 'string') {
    if (partesDeFoto(valor)) acumulado.push(valor);
  } else if (Array.isArray(valor)) {
    valor.forEach(v => linksDeFotos(v, acumulado));
  } else if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(v => linksDeFotos(v, acumulado));
  }
  return acumulado;
}
