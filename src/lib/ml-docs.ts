// Static documentation about how MercadoLibre works internally and how this
// platform approaches each quirk. Rendered by /documentation. Like
// db-docs.ts, content is data and carries its own es/en texts.

import { LText } from './db-docs';

export interface MlConceptDoc {
  id: string;
  title: LText;
  /** How MercadoLibre actually works (the quirk). */
  how: LText;
  /** How this platform handles it. */
  approach: LText;
}

export const ML_CONCEPTS: MlConceptDoc[] = [
  {
    id: 'catalog-buybox',
    title: {
      es: 'Varios vendedores, un solo producto (el "catálogo")',
      en: 'Many sellers, one product (the "catalog")',
    },
    how: {
      es: 'En MercadoLibre muchos vendedores pueden vender exactamente el mismo producto (por ejemplo, el mismo modelo de celular). Para no mostrar decenas de publicaciones repetidas, MercadoLibre las agrupa en un "producto de catálogo" y muestra una sola página, donde un vendedor "gana" la vitrina en cada momento. Ese ganador puede cambiar de un día para otro según precio, reputación y envío.',
      en: 'On MercadoLibre many sellers can sell the exact same product (for example, the same phone model). To avoid showing dozens of duplicate listings, MercadoLibre groups them into a "catalog product" and shows a single page, where one seller "wins" the showcase at any given moment. That winner can change from one day to the next based on price, reputation and shipping.',
    },
    approach: {
      es: 'Le damos a cada producto una identidad propia y estable: si pertenece a un catálogo usamos el código del catálogo; si no, el de la publicación. Así podemos seguir un producto a lo largo del tiempo aunque cambie el vendedor que aparece al frente, y nunca lo contamos dos veces.',
      en: 'We give every product its own stable identity: if it belongs to a catalog we use the catalog code; otherwise, the listing code. This lets us follow a product over time even when the featured seller changes, and we never count it twice.',
    },
  },
  {
    id: 'one-site-per-country',
    title: {
      es: 'Un MercadoLibre distinto por país',
      en: 'A different MercadoLibre per country',
    },
    how: {
      es: 'MercadoLibre no es una sola tienda: es un sitio distinto en cada país (Chile, Argentina, Brasil, México…). Cada sitio tiene sus propias categorías, sus propios códigos de producto y su propia moneda. El mismo producto tiene códigos diferentes en Chile y en Argentina, y no existe una forma oficial de cruzarlos.',
      en: "MercadoLibre is not a single store: it is a separate site in each country (Chile, Argentina, Brazil, Mexico…). Each site has its own categories, its own product codes and its own currency. The same product has different codes in Chile and Argentina, and there is no official way to match them.",
    },
    approach: {
      es: 'Creamos nuestras propias "categorías universales", armadas a mano por el administrador: agrupan bajo un solo nombre las categorías equivalentes de cada país. Además convertimos todos los precios a dólares con el tipo de cambio del día. Con esas dos piezas, comparar países se vuelve posible.',
      en: 'We build our own hand-curated "universal categories": they group the equivalent categories of each country under a single name. We also convert every price to US dollars using that day\'s exchange rate. With those two pieces, comparing countries becomes possible.',
    },
  },
  {
    id: 'bestsellers-page',
    title: {
      es: 'La página de "Más vendidos"',
      en: 'The "Best sellers" page',
    },
    how: {
      es: 'Cada categoría principal puede tener una página pública de "Más vendidos" con los 20 productos que más venden. Es la única ventana pública al ranking real de ventas — pero no todas las categorías la tienen, y MercadoLibre no dice cuántas unidades vende cada producto.',
      en: 'Each main category may have a public "Best sellers" page with the 20 top-selling products. It is the only public window into the real sales ranking — but not every category has one, and MercadoLibre never says how many units each product sells.',
    },
    approach: {
      es: 'Una vez por semana recorremos esas páginas en todos los países y guardamos el top 20 de cada categoría con su posición. También marcamos qué categorías tienen un ranking utilizable, para no gastar esfuerzo en las que no. El movimiento de posiciones semana a semana muestra qué productos suben y cuáles caen.',
      en: 'Once a week we sweep those pages across every country and store each category\'s top 20 with their positions. We also flag which categories have a usable ranking, so no effort is wasted on those that don\'t. Week-over-week movement shows which products rise and which fall.',
    },
  },
  {
    id: 'approximate-figures',
    title: {
      es: 'MercadoLibre no muestra cifras exactas',
      en: 'MercadoLibre does not show exact figures',
    },
    how: {
      es: 'MercadoLibre nunca publica ventas exactas: muestra etiquetas como "+10 mil vendidos" (redondeadas hacia abajo), limita el stock que deja ver, y las opiniones de un producto de catálogo se comparten entre todos los vendedores que lo venden.',
      en: 'MercadoLibre never publishes exact sales: it shows badges like "+10k sold" (rounded down), caps the visible stock, and the reviews of a catalog product are shared across every seller offering it.',
    },
    approach: {
      es: 'Tratamos esas cifras como mínimos ("las ventas reales son al menos X") y las complementamos con señales indirectas: cuánto crecen las opiniones entre una foto y la siguiente, cuánto baja el stock visible y cuántas visitas recibe el producto cada semana. Juntas dan una estimación honesta del volumen y la velocidad de venta.',
      en: 'We treat those figures as floors ("real sales are at least X") and complement them with indirect signals: how much reviews grow between one snapshot and the next, how much visible stock drops, and how many visits the product gets each week. Together they give an honest estimate of sales volume and speed.',
    },
  },
  {
    id: 'how-we-collect',
    title: {
      es: 'Cómo recolectamos los datos',
      en: 'How we collect the data',
    },
    how: {
      es: 'MercadoLibre entrega parte de su información de forma oficial (precios, opiniones, visitas), pero varios datos clave — el ranking de más vendidos, el vendedor que gana la vitrina, la etiqueta de ventas — solo se ven en la página web.',
      en: 'MercadoLibre provides part of its information officially (prices, reviews, visits), but several key facts — the best-sellers ranking, the seller winning the showcase, the sales badge — are only visible on the web page.',
    },
    approach: {
      es: 'Combinamos ambas fuentes en dos etapas: primero leemos las páginas de más vendidos, y después completamos cada producto con la información oficial de MercadoLibre. Un producto pasa a los datos definitivos solo cuando está completo; si algo falla a mitad de camino, queda registrado y el proceso puede retomarse donde quedó.',
      en: 'We combine both sources in two stages: first we read the best-sellers pages, then we complete each product with MercadoLibre\'s official information. A product only reaches the final data once it is complete; if something fails midway, it is recorded and the process can resume where it left off.',
    },
  },
  {
    id: 'immutable-snapshots',
    title: {
      es: 'Fotos que nunca se modifican',
      en: 'Snapshots that never change',
    },
    how: {
      es: 'Los precios, rankings y descuentos en MercadoLibre cambian todo el tiempo, y su página solo muestra el presente: no hay forma de preguntarle "¿cuánto costaba esto hace tres meses?".',
      en: 'Prices, rankings and discounts on MercadoLibre change all the time, and its page only shows the present: there is no way to ask it "how much did this cost three months ago?".',
    },
    approach: {
      es: 'Cada recolección guarda una "foto" nueva de cada producto y nunca modifica las anteriores. Con las fotos acumuladas reconstruimos la historia completa: cómo se movió el precio, cuándo entró o salió del ranking, cómo crecieron sus opiniones y cuándo estuvo en oferta.',
      en: 'Every collection run stores a new "snapshot" of each product and never modifies the previous ones. With the accumulated snapshots we rebuild the full story: how the price moved, when it entered or left the ranking, how its reviews grew and when it was on sale.',
    },
  },
];
