// Si el precio de un producto está en dólares. El botón "USD" del panel guarda
// isUSD; los productos más viejos lo tenían como etiqueta (tag: 'USD'). Antes cada
// parte de la web miraba una sola de las dos, y los perfumes marcados desde el panel
// se veían como "$130", como si fueran pesos.
export const esPrecioUSD = (p) => p?.isUSD === true || p?.tag === 'USD';

/** Lo que va delante del número: "USD " o "$". */
export const simboloPrecio = (p) => (esPrecioUSD(p) ? 'USD ' : '$');
