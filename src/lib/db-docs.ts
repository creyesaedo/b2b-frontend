// Static documentation of the ecosystem's databases, rendered by
// /admin/documentation. Content is data (not UI chrome), so it carries its own
// es/en texts instead of living in the message bundles. Source of truth for
// semantics: ml-service/prisma/schema.prisma + ml-service/DATABASE.md and
// b2b-auth-service/prisma/schema.prisma — keep in sync when models change.
// Texts are written in plain language for non-technical readers.

export type LText = { es: string; en: string };
export type SchemaId = 'mercadolibre' | 'shared';
export type TableKind = 'analytics' | 'operational';

export interface ColumnDoc {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  /** Target table id when this column is a physical FK. */
  fk?: string;
  what: LText;
  /** Market-analysis value. Omitted for purely infrastructural columns. */
  value?: LText;
}

export interface TableDoc {
  /** Physical table name; also the anchor id in the docs page. */
  id: string;
  schema: SchemaId;
  kind: TableKind;
  description: LText;
  /** Mutability / lifecycle note shown next to the description. */
  note?: LText;
  columns: ColumnDoc[];
}

export interface RelationDoc {
  from: string;
  to: string;
  kind: 'fk' | 'soft';
  label: string;
}

export function pickText(text: LText, locale: string): string {
  return locale === 'en' ? text.en : text.es;
}

const INFRA_PK: LText = {
  es: 'Número interno que identifica cada fila.',
  en: 'Internal number that identifies each row.',
};
const INFRA_VALUE: LText = {
  es: 'Solo para uso interno del sistema.',
  en: 'Internal system use only.',
};

export const DB_TABLES: TableDoc[] = [
  // ── shared ────────────────────────────────────────────────────────────────
  {
    id: 'global_categories',
    schema: 'shared',
    kind: 'analytics',
    description: {
      es: 'Categoría "universal" creada a mano por el administrador. Agrupa bajo un solo nombre las categorías equivalentes de cada país (todas las "Electrodomésticos" de Chile, Argentina y Brasil apuntan a una sola), y así el explorador muestra cada concepto una vez y se pueden comparar países.',
      en: 'Hand-curated "universal" category. It groups the equivalent categories of each country under one name (every "Home appliances" from Chile, Argentina and Brazil points to a single one), so the explorer shows each concept once and countries can be compared.',
    },
    note: {
      es: 'Vive en el área compartida: si a futuro se suman otros marketplaces (Amazon, eBay), también se conectarán aquí.',
      en: 'Lives in the shared area: if other marketplaces (Amazon, eBay) are added in the future, they will connect here too.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'name',
        type: 'varchar(255)',
        nullable: false,
        what: { es: 'Nombre elegido por el administrador (ej. "Electrónica").', en: 'Name chosen by the admin (e.g. "Electronics").' },
        value: { es: 'La pieza que permite comparar países: los códigos de MercadoLibre son distintos en cada país, y este nombre los une.', en: 'The piece that makes country comparison possible: MercadoLibre codes differ per country, and this name unites them.' },
      },
      {
        name: 'slug',
        type: 'varchar(255) UNIQUE',
        nullable: false,
        what: { es: 'Versión del nombre apta para direcciones web (sin espacios ni tildes).', en: 'Web-address-friendly version of the name (no spaces or accents).' },
        value: { es: 'Hace estables los filtros y enlaces del explorador.', en: 'Keeps explorer filters and links stable.' },
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Fecha en que se creó la categoría universal.', en: 'When the universal category was created.' },
        value: { es: 'Registro de cuándo se hizo el trabajo de organización.', en: 'Record of when the curation work was done.' },
      },
    ],
  },
  {
    id: 'global_subcategories',
    schema: 'shared',
    kind: 'analytics',
    description: {
      es: 'Segundo nivel de agrupación: subcategoría universal dentro de una categoría universal. El administrador reúne las subcategorías equivalentes de cada país (todas las "Celulares y Smartphones" quedan bajo la universal "Electrónica").',
      en: 'Second grouping level: a universal subcategory nested under a universal category. The admin gathers the equivalent subcategories of each country (every "Cell Phones & Smartphones" goes under the universal "Electronics").',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'name',
        type: 'varchar(255)',
        nullable: false,
        what: { es: 'Nombre de la subcategoría universal.', en: 'Universal subcategory name.' },
        value: { es: 'Permite comparar el mismo nicho entre países, con más detalle que la categoría.', en: 'Enables comparing the same niche across countries, in more detail than the category.' },
      },
      {
        name: 'slug',
        type: 'varchar(255)',
        nullable: false,
        what: { es: 'Versión del nombre apta para direcciones web; única dentro de su categoría.', en: 'Web-address-friendly version of the name; unique within its category.' },
        value: { es: 'Hace estables los filtros anidados del explorador.', en: 'Keeps nested explorer filters stable.' },
      },
      {
        name: 'global_category_id',
        type: 'int',
        nullable: false,
        fk: 'global_categories',
        what: { es: 'Indica a qué categoría universal pertenece.', en: 'Which universal category it belongs to.' },
        value: { es: 'Define la jerarquía de dos niveles que usan los filtros.', en: 'Defines the two-level hierarchy the filters use.' },
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Fecha en que se creó.', en: 'When it was created.' },
        value: { es: 'Registro del trabajo de organización.', en: 'Record of the curation work.' },
      },
    ],
  },

  // ── mercadolibre: analytics core ─────────────────────────────────────────
  {
    id: 'categories',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Categorías de MercadoLibre tal como existen en cada país. Las principales vienen de la información oficial de MercadoLibre; las más específicas se descubren al revisar productos. Tienen solo dos niveles: categoría principal y subcategoría.',
      en: 'MercadoLibre categories as they exist in each country. The main ones come from MercadoLibre\'s official information; the more specific ones are discovered while reviewing products. There are only two levels: main category and subcategory.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'name',
        type: 'varchar(255)',
        nullable: false,
        what: { es: 'Nombre tal como aparece en MercadoLibre (ej. "Herramientas").', en: 'Name as shown on MercadoLibre (e.g. "Tools").' },
        value: { es: 'La etiqueta que ves en todos los reportes por categoría.', en: 'The label you see in every per-category report.' },
      },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: false,
        what: { es: 'País de MercadoLibre donde existe ("MLC" = Chile, "MLA" = Argentina, "MLB" = Brasil…).', en: 'MercadoLibre country where it exists ("MLC" = Chile, "MLA" = Argentina, "MLB" = Brazil…).' },
        value: { es: 'Permite separar la información por país sin mezclar códigos.', en: 'Keeps information separated per country without mixing codes.' },
      },
      {
        name: 'ml_id',
        type: 'varchar(50) UNIQUE',
        nullable: false,
        what: { es: 'Código que MercadoLibre le asigna a la categoría (ej. "MLC1574").', en: 'Code MercadoLibre assigns to the category (e.g. "MLC1574").' },
        value: { es: 'La única referencia estable frente a MercadoLibre: permite volver a consultar la misma categoría en cada recolección.', en: 'The only stable reference against MercadoLibre: it lets us query the same category again on every collection.' },
      },
      {
        name: 'parent_id',
        type: 'int',
        nullable: true,
        fk: 'categories',
        what: { es: 'Vacío = es una categoría principal; con valor = es una subcategoría, e indica a cuál principal pertenece.', en: 'Empty = it is a main category; filled = it is a subcategory, pointing to its main category.' },
        value: { es: 'Permite ver reportes tanto de "Herramientas" en general como de "Sierras eléctricas" en particular, sin duplicar datos.', en: 'Enables reports both for "Tools" overall and "Power saws" specifically, without duplicating data.' },
      },
      {
        name: 'has_bestsellers',
        type: 'boolean',
        nullable: true,
        what: { es: '¿La categoría tiene una página de "más vendidos" utilizable? Vacío = aún no se ha revisado; sí = tiene ranking; no = no lo tiene (no existe, está vacía o pide iniciar sesión).', en: 'Does the category have a usable "best sellers" page? Empty = not checked yet; yes = it has a ranking; no = it does not (missing, empty or requires login).' },
        value: { es: 'Define qué categorías se pueden medir, y evita trabajo innecesario en las que no.', en: 'Defines which categories can be measured, and avoids wasted work on those that cannot.' },
      },
      {
        name: 'bestsellers_checked_at',
        type: 'timestamp',
        nullable: true,
        what: { es: 'Última vez que se revisó si existe la página de más vendidos.', en: 'Last time the best-sellers page was checked.' },
        value: { es: 'Una categoría puede ganar o perder su ranking con el tiempo; esto indica qué tan al día está el dato.', en: 'A category can gain or lose its ranking over time; this shows how fresh the flag is.' },
      },
      {
        name: 'global_category_id',
        type: 'int',
        nullable: true,
        fk: 'global_categories',
        what: { es: 'Conexión (opcional) con la categoría universal, asignada a mano por el administrador.', en: 'Optional link to the universal category, assigned by hand by the admin.' },
        value: { es: 'El puente que hace posible comparar países: sin él, cada país queda aislado.', en: 'The bridge that makes country comparison possible: without it, each country stays isolated.' },
      },
      {
        name: 'global_subcategory_id',
        type: 'int',
        nullable: true,
        fk: 'global_subcategories',
        what: { es: 'Conexión (opcional) con la subcategoría universal; solo aplica a subcategorías. Al asignarla, la categoría madre también se conecta automáticamente para mantener todo coherente.', en: 'Optional link to the universal subcategory; only applies to subcategories. Assigning it also connects the parent category automatically, keeping things coherent.' },
        value: { es: 'Comparación entre países al nivel más fino, donde las diferencias competitivas son más accionables.', en: 'Country comparison at the finest level, where competitive differences are most actionable.' },
      },
    ],
  },
  {
    id: 'products',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'La tabla más importante: cada fila es una "foto" de un producto en un momento dado. Las fotos anteriores nunca se modifican; cada recolección agrega fotos nuevas. Gracias a eso se puede reconstruir la historia de precios, rankings, opiniones y stock.',
      en: 'The most important table: each row is a "snapshot" of a product at a given moment. Older snapshots are never modified; every collection adds new ones. That is what makes the history of prices, rankings, reviews and stock reconstructible.',
    },
    note: {
      es: 'La "versión actual" de un producto es simplemente su foto más reciente. Muchos campos pueden venir vacíos si MercadoLibre no mostró ese dato.',
      en: 'A product\'s "current version" is simply its most recent snapshot. Many fields may be empty when MercadoLibre did not show that piece of data.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: { es: 'Número interno de cada foto.', en: 'Internal number of each snapshot.' }, value: INFRA_VALUE },
      {
        name: 'name',
        type: 'varchar(500)',
        nullable: false,
        what: { es: 'Título del producto tal como aparece en MercadoLibre.', en: 'Product title as shown on MercadoLibre.' },
        value: { es: 'Permite buscar por texto, agrupar por palabras clave y detectar cambios de nombre (rebranding, ediciones especiales).', en: 'Enables text search, keyword grouping and name-change detection (rebranding, special editions).' },
      },
      {
        name: 'price',
        type: 'decimal(14,2)',
        nullable: false,
        what: { es: 'Precio en la moneda del país.', en: 'Price in the country\'s currency.' },
        value: { es: 'La métrica central: seguimiento de precios, comparación con la competencia y detección de ofertas.', en: 'The core metric: price tracking, competitive comparison and promo detection.' },
      },
      {
        name: 'url',
        type: 'varchar(1000)',
        nullable: true,
        what: { es: 'Dirección web de la publicación.', en: 'Web address of the listing.' },
        value: { es: 'Permite ir directo a la publicación original y verificar el dato.', en: 'Jump straight to the original listing and verify the data.' },
      },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: true,
        what: { es: 'País de MercadoLibre del producto.', en: 'The product\'s MercadoLibre country.' },
        value: { es: 'Filtros y comparaciones por país sin cálculos extra.', en: 'Per-country filters and comparisons with no extra work.' },
      },
      {
        name: 'category_id',
        type: 'int',
        nullable: true,
        fk: 'categories',
        what: { es: 'Categoría donde se encontró el producto (la más específica que se conoce). Puede quedar vacía en productos seguidos sin categoría conocida.', en: 'Category where the product was found (the most specific one known). May be empty for tracked products with no known category.' },
        value: { es: 'Permite analizar el mercado por nicho específico, no solo por categoría grande.', en: 'Enables market analysis per specific niche, not just the big category.' },
      },
      {
        name: 'parent_id',
        type: 'int',
        nullable: true,
        fk: 'categories',
        what: { es: 'La categoría principal, cuando la anterior es una subcategoría. Vacío si la anterior ya es la principal.', en: 'The main category, when the previous one is a subcategory. Empty when the previous one already is the main category.' },
        value: { es: 'Agiliza los reportes a nivel de categoría principal.', en: 'Speeds up main-category-level reports.' },
      },
      {
        name: 'seller_id',
        type: 'int',
        nullable: true,
        fk: 'sellers',
        what: { es: 'Vendedor de la publicación; vacío si no se pudo identificar.', en: 'The listing\'s seller; empty if it could not be identified.' },
        value: { es: 'Cruce producto-vendedor: qué vendedores dominan una categoría, peso de las Tiendas Oficiales.', en: 'Product-seller crossing: which sellers dominate a category, weight of Official Stores.' },
      },
      {
        name: 'source',
        type: 'varchar(20)',
        nullable: false,
        what: { es: 'Origen de la foto: "bestsellers" (barrido semanal del ranking de más vendidos) o "tracked" (producto que un cliente pidió seguir).', en: 'Snapshot origin: "bestsellers" (weekly sweep of the best-sellers ranking) or "tracked" (a product a client asked to follow).' },
        value: { es: 'Separa la mirada de mercado del seguimiento por cliente, manteniendo todo junto para el análisis.', en: 'Separates the market view from per-client tracking, while keeping everything together for analysis.' },
      },
      {
        name: 'snapshot_date',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Momento en que se tomó la foto; es el mismo para todas las fotos de una recolección.', en: 'Moment the snapshot was taken; identical across all snapshots of one collection run.' },
        value: { es: 'El eje del tiempo: toda la historia de precios, rankings y opiniones se construye sobre esta fecha.', en: 'The time axis: the whole history of prices, rankings and reviews is built on this date.' },
      },
      {
        name: 'catalog_id',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Código del producto en el catálogo de MercadoLibre (compartido por todos los vendedores que venden ese mismo producto). Vacío si la publicación no pertenece a un catálogo. Ojo: cada país usa sus propios códigos.', en: 'The product\'s code in MercadoLibre\'s catalog (shared by every seller offering that same product). Empty when the listing does not belong to a catalog. Note: each country uses its own codes.' },
        value: { es: 'Permite seguir el producto en el tiempo aunque cambie el vendedor que aparece al frente.', en: 'Lets us follow the product over time even when the featured seller changes.' },
      },
      {
        name: 'ml_public_id',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Código de la publicación específica que estaba al frente de la vitrina en ese momento.', en: 'Code of the specific listing that was at the front of the showcase at that moment.' },
        value: { es: 'Permite reconstruir la dirección web y detectar cuándo cambia el vendedor ganador.', en: 'Rebuild the web address and detect when the winning seller changes.' },
      },
      {
        name: 'canonical_id',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Identidad definitiva del producto: usa el código de catálogo si existe; si no, el de la publicación. Se fija al guardar la foto y nunca cambia.', en: 'The product\'s definitive identity: the catalog code when there is one, otherwise the listing code. Set when the snapshot is stored and never changes.' },
        value: { es: 'LA clave para no contar el mismo producto dos veces: el explorador y las fichas de producto la usan como identidad.', en: 'THE key to never count the same product twice: the explorer and product pages use it as identity.' },
      },
      {
        name: 'product_type',
        type: 'varchar(16)',
        nullable: true,
        what: { es: 'Tipo de publicación según su dirección web: de catálogo, de vendedor, o publicación clásica.', en: 'Listing type according to its web address: catalog, seller-owned, or classic listing.' },
        value: { es: 'Distingue los tres orígenes de producto y explica por qué algunos traen más información que otros.', en: 'Separates the three product origins and explains why some carry more information than others.' },
      },
      {
        name: 'date_created',
        type: 'timestamp',
        nullable: true,
        what: { es: 'Fecha en que el producto apareció por primera vez en MercadoLibre.', en: 'Date the product first appeared on MercadoLibre.' },
        value: { es: 'Edad del producto en el top: ¿dominan los lanzamientos recientes o los productos antiguos?', en: 'Product age within the top: do recent launches or legacy products dominate?' },
      },
      {
        name: 'sold_count',
        type: 'int',
        nullable: true,
        what: { es: 'Ventas históricas aproximadas según la etiqueta "+X mil vendidos". Es un mínimo: la cifra real es igual o mayor.', en: 'Approximate historical sales from the "+X k sold" badge. A floor: the real figure is equal or higher.' },
        value: { es: 'La mejor aproximación disponible al volumen de ventas; comparando fotos se estima la velocidad de venta.', en: 'The best available approximation of sales volume; comparing snapshots estimates sales speed.' },
      },
      {
        name: 'rating',
        type: 'decimal(3,2)',
        nullable: true,
        what: { es: 'Nota promedio de 0 a 5 estrellas, según la información oficial de MercadoLibre.', en: 'Average score from 0 to 5 stars, from MercadoLibre\'s official information.' },
        value: { es: 'Calidad percibida — se puede cruzar con el descuento ("barato pero malo") o con el tipo de vendedor.', en: 'Perceived quality — cross it with the discount ("cheap but bad") or the seller type.' },
      },
      {
        name: 'review_count',
        type: 'int',
        nullable: true,
        what: { es: 'Cantidad total de opiniones. En productos de catálogo, las opiniones son compartidas por todos los vendedores del mismo producto.', en: 'Total number of reviews. For catalog products, reviews are shared by every seller of the same product.' },
        value: { es: 'Madurez del producto (4,9 con 5 opiniones no es lo mismo que 4,5 con 5.000); su crecimiento entre fotos es otra pista de ventas.', en: 'Product maturity (4.9 with 5 reviews is not the same as 4.5 with 5,000); its growth between snapshots is another sales clue.' },
      },
      {
        name: 'review_levels',
        type: 'json',
        nullable: true,
        what: { es: 'Cuántas opiniones hay de cada cantidad de estrellas (de 1 a 5).', en: 'How many reviews there are for each star level (1 to 5).' },
        value: { es: 'Muestra lo que el promedio esconde: muchas de 5★ y muchas de 1★ a la vez delatan problemas de calidad u opiniones infladas.', en: 'Shows what the average hides: lots of 5★ and lots of 1★ at once expose quality issues or inflated reviews.' },
      },
      {
        name: 'weekly_visits',
        type: 'int',
        nullable: true,
        what: { es: 'Visitas que recibió la publicación en los últimos 7 días, según MercadoLibre.', en: 'Visits the listing received over the last 7 days, according to MercadoLibre.' },
        value: { es: 'Medida directa del interés de los compradores; junto a las ventas permite estimar qué tan bien convierte.', en: 'Direct measure of shopper interest; with sales it helps estimate how well it converts.' },
      },
      {
        name: 'brand',
        type: 'varchar(255)',
        nullable: true,
        what: { es: 'Marca declarada del producto.', en: 'The product\'s declared brand.' },
        value: { es: 'Participación de mercado por marca, sobreprecio promedio y comparación entre marcas.', en: 'Brand market share, average price premium and brand-to-brand comparison.' },
      },
      {
        name: 'holiday_name',
        type: 'varchar(255)',
        nullable: true,
        what: { es: 'Nombre del feriado, si la foto se tomó un día feriado en ese país. Vacío en días normales.', en: 'Holiday name, if the snapshot was taken on a holiday in that country. Empty on normal days.' },
        value: { es: 'Permite excluir días atípicos de los promedios o estudiar el efecto de los feriados en precios y rankings.', en: 'Exclude atypical days from baselines, or study the holiday effect on prices and rankings.' },
      },
      {
        name: 'ranking_position',
        type: 'int',
        nullable: true,
        what: { es: 'Posición (1 a 20) en la página de más vendidos de la categoría principal en ese momento. Vacío en productos en seguimiento.', en: 'Position (1 to 20) on the main category\'s best-sellers page at that moment. Empty for tracked products.' },
        value: { es: 'Medida de visibilidad: su movimiento semana a semana muestra qué sube, qué cae y quién entra nuevo.', en: 'Visibility measure: its week-over-week movement shows what rises, what falls and who enters new.' },
      },
      {
        name: 'original_price',
        type: 'decimal(14,2)',
        nullable: true,
        what: { es: 'Precio antes del descuento. Vacío cuando no hay descuento activo.', en: 'Price before the discount. Empty when there is no active discount.' },
        value: { es: 'Permite medir el descuento real y detectar "falsos descuentos" (precio inflado antes de la oferta).', en: 'Measure the real discount and detect "fake discounts" (price inflated before the promo).' },
      },
      {
        name: 'discount_pct',
        type: 'int',
        nullable: true,
        what: { es: 'Porcentaje de descuento mostrado (1 a 100). Vacío si no hay descuento.', en: 'Displayed discount percentage (1 to 100). Empty when there is no discount.' },
        value: { es: 'Intensidad de ofertas por categoría y país: qué parte del top está en oferta, detección de eventos tipo CyberDay.', en: 'Promo intensity per category and country: how much of the top is on sale, detection of Cyber-style events.' },
      },
      {
        name: 'shipping_type',
        type: 'varchar(20)',
        nullable: true,
        what: { es: 'Tipo de envío: "full" (despachado desde bodegas de MercadoLibre), "cross_border" (importado), "free" (gratis) o "standard" (con costo).', en: 'Shipping type: "full" (shipped from MercadoLibre warehouses), "cross_border" (imported), "free" or "standard" (paid).' },
        value: { es: 'Nivel de profesionalización del vendedor: el envío "full" suele asociarse a más ventas.', en: 'Seller professionalization level: "full" shipping usually correlates with more sales.' },
      },
      {
        name: 'listing_type_id',
        type: 'varchar(20)',
        nullable: true,
        what: { es: 'Plan de publicación contratado por el vendedor: Premium ("gold_pro"), Clásica ("gold_special") u otros.', en: 'Listing plan the seller pays for: Premium ("gold_pro"), Classic ("gold_special") or others.' },
        value: { es: 'Cuánto invierte un vendedor para estar en el top; refleja barreras de entrada por categoría.', en: 'How much a seller invests to stay in the top; reflects entry barriers per category.' },
      },
      {
        name: 'is_cbt',
        type: 'boolean',
        nullable: false,
        what: { es: 'Sí/no: ¿la publicación pertenece a un vendedor internacional (venta desde el extranjero)?', en: 'Yes/no: does the listing belong to an international seller (selling from abroad)?' },
        value: { es: 'Peso de los importadores frente a los vendedores locales — clave en electrónica y moda.', en: 'Weight of importers versus local sellers — key in electronics and fashion.' },
      },
      {
        name: 'currency',
        type: 'varchar(3)',
        nullable: true,
        what: { es: 'Moneda del precio ("CLP", "ARS", "BRL"…).', en: 'Currency of the price ("CLP", "ARS", "BRL"…).' },
        value: { es: 'Deja claro en qué moneda está cada precio.', en: 'Makes clear which currency each price is in.' },
      },
      {
        name: 'exchange_rate',
        type: 'decimal(18,8)',
        nullable: true,
        what: { es: 'Cuántas unidades de moneda local equivalían a 1 dólar el día de la foto.', en: 'How many local currency units equaled 1 US dollar on the snapshot day.' },
        value: { es: 'Hace la conversión a dólares verificable y permite estudiar el efecto del tipo de cambio.', en: 'Makes the dollar conversion verifiable and lets you study the exchange-rate effect.' },
      },
      {
        name: 'usd_price',
        type: 'decimal(14,2)',
        nullable: true,
        what: { es: 'El precio convertido a dólares.', en: 'The price converted to US dollars.' },
        value: { es: 'La unidad común para comparar precios entre países sin distorsión de moneda.', en: 'The common unit to compare prices across countries without currency distortion.' },
      },
      {
        name: 'usd_original_price',
        type: 'decimal(14,2)',
        nullable: true,
        what: { es: 'El precio antes del descuento, convertido a dólares con la misma tasa.', en: 'The pre-discount price, converted to dollars at the same rate.' },
        value: { es: 'Permite comparar la profundidad de las ofertas entre países.', en: 'Compare discount depth across countries.' },
      },
      {
        name: 'available_quantity',
        type: 'int',
        nullable: true,
        what: { es: 'Stock declarado por el vendedor. MercadoLibre limita lo que muestra: en publicaciones con mucho stock es un mínimo.', en: 'Stock declared by the seller. MercadoLibre caps what it displays: for high-stock listings it is a floor.' },
        value: { es: 'La mejor pista de escasez disponible; su caída entre fotos estima la velocidad real de venta.', en: 'The best available scarcity clue; its drop between snapshots estimates real sales speed.' },
      },
      {
        name: 'installments_quantity',
        type: 'int',
        nullable: true,
        what: { es: 'Cantidad de cuotas ofrecidas (ej. 12). Vacío si no ofrece cuotas.', en: 'Number of installments offered (e.g. 12). Empty when none.' },
        value: { es: 'El financiamiento es una palanca de precio central en Latinoamérica: qué tan agresivas son las cuotas por categoría y vendedor.', en: 'Financing is a core price lever in Latin America: how aggressive installments are per category and seller.' },
      },
      {
        name: 'installments_amount',
        type: 'decimal(14,2)',
        nullable: true,
        what: { es: 'Monto de cada cuota, en moneda local. Vacío sin cuotas.', en: 'Amount of each installment, in local currency. Empty when no installments.' },
        value: { es: 'Reconstruye la oferta "12 cuotas de $1.946": dos productos al mismo precio no son equivalentes si las cuotas difieren.', en: 'Rebuilds the "12x $1,946" offer: two products at the same price are not equivalent if installments differ.' },
      },
      {
        name: 'installments_interest_free',
        type: 'boolean',
        nullable: true,
        what: { es: 'Sí = cuotas sin interés; no = con recargo; vacío = no ofrece cuotas.', en: 'Yes = interest-free installments; no = surcharged; empty = no installments offered.' },
        value: { es: '"Sin interés" elimina el costo de financiar la compra — un diferenciador competitivo fuerte.', en: '"Interest-free" removes the cost of financing the purchase — a strong competitive differentiator.' },
      },
    ],
  },
  {
    id: 'sellers',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Vendedores con su información más reciente. A diferencia de los productos, aquí la ficha SÍ se actualiza en cada recolección (no se guarda historial).',
      en: 'Sellers with their most recent information. Unlike products, this record IS updated on every collection (no history is kept).',
    },
    note: {
      es: 'Las cifras "+N" de MercadoLibre vienen redondeadas hacia abajo: guardamos ese mínimo, no el dato exacto.',
      en: 'MercadoLibre\'s "+N" figures come rounded down: we store that floor, not the exact number.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'ml_seller_id',
        type: 'varchar(50) UNIQUE',
        nullable: false,
        what: { es: 'Código del vendedor en MercadoLibre.', en: 'The seller\'s code on MercadoLibre.' },
        value: { es: 'Referencia estable: permite volver a su perfil y reconocerlo entre países y recolecciones.', en: 'Stable reference: reopen the profile and recognize the seller across countries and collections.' },
      },
      {
        name: 'nickname',
        type: 'varchar(255)',
        nullable: true,
        what: { es: 'Nombre público del vendedor (cambia si se renombra).', en: 'The seller\'s public name (changes if renamed).' },
        value: { es: 'La etiqueta legible de los reportes — sin ella el código es incomprensible.', en: 'The readable label in reports — without it the code means nothing.' },
      },
      {
        name: 'is_official_store',
        type: 'boolean',
        nullable: false,
        what: { es: 'Sí/no: ¿MercadoLibre lo marca como "Tienda Oficial"?', en: 'Yes/no: does MercadoLibre flag it as an "Official Store"?' },
        value: { es: 'Separa marcas oficiales de revendedores; entre países muestra qué marcas apostaron por un canal directo.', en: 'Separates official brands from resellers; across countries it shows which brands invested in a direct channel.' },
      },
      {
        name: 'power_seller_status',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Nivel MercadoLíder ("platinum", "gold", "silver"…) o vacío si no tiene el sello.', en: 'MercadoLíder level ("platinum", "gold", "silver"…) or empty if it has no badge.' },
        value: { es: 'Sello de confianza y volumen que otorga MercadoLibre: filtrar por Platinum aísla a los mejores operadores.', en: 'Trust-and-volume badge granted by MercadoLibre: filtering by Platinum isolates the best operators.' },
      },
      {
        name: 'total_products',
        type: 'int',
        nullable: true,
        what: { es: 'Cantidad aproximada de productos publicados (es un mínimo).', en: 'Approximate number of published products (a floor).' },
        value: { es: 'Tamaño del catálogo: distingue a un vendedor de nicho de un gran operador.', en: 'Catalog size: distinguishes a niche seller from a large operator.' },
      },
      {
        name: 'total_sales',
        type: 'int',
        nullable: true,
        what: { es: 'Ventas históricas totales aproximadas (es un mínimo).', en: 'Approximate total historical sales (a floor).' },
        value: { es: 'Tamaño total del negocio: ranking de grandes vendedores y participación de mercado.', en: 'Total business size: top-seller ranking and market-share estimation.' },
      },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: true,
        what: { es: 'País donde vimos al vendedor por primera vez.', en: 'Country where we first saw the seller.' },
        value: { es: 'Permite segmentar vendedores por mercado de origen ("¿cuántos del top de México venden también en Chile?").', en: 'Segment sellers by origin market ("how many of Mexico\'s top sellers also sell in Chile?").' },
      },
      {
        name: 'first_seen',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Cuándo apareció por primera vez en nuestros datos (no su antigüedad real en MercadoLibre).', en: 'When it first appeared in our data (not its real age on MercadoLibre).' },
        value: { es: 'Detecta vendedores nuevos en el top: la entrada de nuevos competidores.', en: 'Detects sellers new to the top: new competitors entering the market.' },
      },
      {
        name: 'last_seen',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Última recolección donde apareció.', en: 'Last collection where it appeared.' },
        value: { es: 'Si lleva más de 30 días sin aparecer, probablemente salió del ranking.', en: 'If it has not appeared for over 30 days, it probably dropped out of the ranking.' },
      },
    ],
  },
  {
    id: 'catalog_products',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Lista de productos de catálogo sin repetidos (una fila por producto), usada por el buscador. Se actualiza en cada recolección.',
      en: 'Deduplicated list of catalog products (one row per product), used by the search box. Updated on every collection.',
    },
    columns: [
      {
        name: 'catalog_id',
        type: 'varchar(50)',
        nullable: false,
        pk: true,
        what: { es: 'Código del producto en el catálogo de MercadoLibre.', en: 'The product\'s code in MercadoLibre\'s catalog.' },
        value: { es: 'Punto de partida del buscador de productos y puente hacia su historial de fotos.', en: 'Entry point of product search and bridge to its snapshot history.' },
      },
      {
        name: 'name',
        type: 'varchar(500)',
        nullable: false,
        what: { es: 'Nombre del producto (la última versión vista).', en: 'Product name (latest version seen).' },
        value: { es: 'Etiqueta estable para el buscador, sin tener que recorrer todo el historial.', en: 'Stable label for the search box, without scanning the whole history.' },
      },
      {
        name: 'brand',
        type: 'varchar(255)',
        nullable: true,
        what: { es: 'Marca (la última vista).', en: 'Brand (latest seen).' },
        value: { es: 'Filtro por marca en el buscador y resúmenes rápidos.', en: 'Brand filter in search and quick summaries.' },
      },
      {
        name: 'first_seen_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Primera vez que el producto apareció en nuestros datos.', en: 'First time the product appeared in our data.' },
        value: { es: 'Antigüedad del producto en el sistema.', en: 'Product tenure in the system.' },
      },
      {
        name: 'last_seen_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Última vez que apareció.', en: 'Last time it appeared.' },
        value: { es: 'Detecta productos que dejaron de aparecer en el top.', en: 'Detects products that stopped appearing in the top.' },
      },
    ],
  },
  {
    id: 'tracked_products',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Pedidos de seguimiento: un cliente pide seguir UN producto en el tiempo. Todos los días, el sistema revisa los seguimientos activos que tocan, guarda una foto nueva si algo cambió, registra sus visitas y agenda la próxima revisión.',
      en: 'Tracking requests: a client asks to follow ONE product over time. Every day, the system checks the active subscriptions that are due, stores a new snapshot if something changed, records their visits and schedules the next check.',
    },
    note: {
      es: 'Si un cliente vuelve a pedir el mismo producto, no se duplica el seguimiento.',
      en: 'If a client requests the same product again, the tracking is not duplicated.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'client_id',
        type: 'varchar(64)',
        nullable: false,
        what: { es: 'Identificador del cliente que pidió el seguimiento (usuario de la plataforma).', en: 'Identifier of the client who requested the tracking (a platform user).' },
        value: { es: 'Muestra qué productos le importan a qué clientes: una señal de demanda de los propios usuarios.', en: 'Shows which products matter to which clients: a demand signal from our own users.' },
      },
      {
        name: 'url',
        type: 'varchar(1000)',
        nullable: false,
        what: { es: 'Dirección web del producto a seguir.', en: 'Web address of the product to follow.' },
        value: { es: 'Define exactamente CUÁL publicación se sigue, incluso si no pertenece a un catálogo.', en: 'Defines exactly WHICH listing is followed, even when it does not belong to a catalog.' },
      },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: false,
        what: { es: 'País de MercadoLibre del producto.', en: 'The product\'s MercadoLibre country.' },
        value: { es: 'Ubica el seguimiento y el análisis en su mercado.', en: 'Places the tracking and analysis in its market.' },
      },
      {
        name: 'catalog_id',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Código de catálogo del producto seguido, si tiene.', en: 'Catalog code of the tracked product, when it has one.' },
        value: { es: 'Conecta el seguimiento del cliente con la historia pública del mismo producto.', en: 'Connects the client\'s tracking with the same product\'s public history.' },
      },
      {
        name: 'ml_public_id',
        type: 'varchar(50)',
        nullable: true,
        what: { es: 'Código de la publicación concreta, si se identificó.', en: 'Code of the concrete listing, when identified.' },
        value: { es: 'Identidad alternativa cuando el producto no tiene catálogo.', en: 'Fallback identity when the product has no catalog.' },
      },
      {
        name: 'cadence_hours',
        type: 'int',
        nullable: false,
        what: { es: 'Cada cuántas horas se pidió revisar, con mínimo de 24 (la revisión corre una vez al día).', en: 'How often (in hours) it should be checked, with a 24-hour minimum (the check runs once a day).' },
        value: { es: 'Equilibra el detalle de la serie del cliente con el costo de recolectar.', en: 'Balances the detail of the client\'s series against collection cost.' },
      },
      {
        name: 'next_run_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Próxima revisión programada.', en: 'Next scheduled check.' },
        value: { es: 'Uso interno: organiza la agenda de revisiones.', en: 'Internal use: drives the check schedule.' },
      },
      {
        name: 'active',
        type: 'boolean',
        nullable: false,
        what: { es: 'No = seguimiento en pausa (el historial se conserva).', en: 'No = tracking paused (the history is kept).' },
        value: { es: 'Permite pausar sin perder lo acumulado.', en: 'Pause without losing what was accumulated.' },
      },
      {
        name: 'last_run_at',
        type: 'timestamp',
        nullable: true,
        what: { es: 'Última revisión realizada.', en: 'Last check performed.' },
        value: { es: 'Uso interno: controla que el seguimiento esté al día.', en: 'Internal use: monitors tracking freshness.' },
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Cuándo se creó el seguimiento.', en: 'When the tracking was created.' },
        value: { es: 'Inicio esperado de la serie del cliente.', en: 'Expected start of the client\'s series.' },
      },
    ],
  },
  {
    id: 'product_visits',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Registro diario de visitas de los productos en seguimiento. Se guarda aparte de las fotos a propósito: las visitas cambian todos los días aunque el producto no cambie, así que una fila pequeña por día conserva la curva completa de interés sin ensuciar el historial.',
      en: 'Daily visit record of tracked products. Kept apart from snapshots on purpose: visits change every day even when the product does not, so one small row per day preserves the full interest curve without polluting the history.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'canonical_id',
        type: 'varchar(50)',
        nullable: false,
        what: { es: 'Identidad del producto (la misma que usan las fotos).', en: 'Product identity (the same one the snapshots use).' },
        value: { es: 'Une la curva de visitas con la historia del mismo producto.', en: 'Joins the visit curve with the same product\'s history.' },
      },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: false,
        what: { es: 'País de MercadoLibre.', en: 'MercadoLibre country.' },
        value: { es: 'Los códigos de producto son por país: sin el país serían ambiguos.', en: 'Product codes are per-country: without the country they would be ambiguous.' },
      },
      {
        name: 'visit_date',
        type: 'date',
        nullable: false,
        what: { es: 'Día de la medición (una fila por día).', en: 'Measurement day (one row per day).' },
        value: { es: 'El eje del tiempo de la curva de interés.', en: 'The time axis of the interest curve.' },
      },
      {
        name: 'weekly_visits',
        type: 'int',
        nullable: true,
        what: { es: 'Visitas de los últimos 7 días, según MercadoLibre ese día.', en: 'Last-7-days visits, according to MercadoLibre that day.' },
        value: { es: 'La curva diaria de interés: los picos delatan campañas o estacionalidad; las caídas, pérdida de interés.', en: 'The daily interest curve: spikes reveal campaigns or seasonality; drops, fading interest.' },
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Cuándo se registró la medición.', en: 'When the measurement was recorded.' },
        value: { es: 'Registro de la medición.', en: 'Measurement record.' },
      },
    ],
  },
  {
    id: 'product_category_overrides',
    schema: 'mercadolibre',
    kind: 'analytics',
    description: {
      es: 'Correcciones hechas a mano: productos que MercadoLibre puso en la categoría equivocada. La corrección siempre saca al producto de la categoría errónea; opcionalmente lo reasigna a la subcategoría universal correcta. Como usa el código estable del producto, la corrección sobrevive a futuras recolecciones y aplica también a los datos ya guardados.',
      en: 'Hand-made corrections: products MercadoLibre placed under the wrong category. A correction always removes the product from the wrong category; optionally it reassigns it to the right universal subcategory. Since it uses the product\'s stable code, the correction survives future collections and also applies to already-stored data.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK, value: INFRA_VALUE },
      {
        name: 'country',
        type: 'varchar(10)',
        nullable: false,
        what: { es: 'País del producto (los códigos de producto son por país).', en: 'The product\'s country (product codes are per-country).' },
        value: { es: 'Delimita el alcance de la corrección.', en: 'Scopes the correction correctly.' },
      },
      {
        name: 'ml_public_id',
        type: 'varchar(50)',
        nullable: false,
        what: { es: 'Código estable del producto mal clasificado.', en: 'Stable code of the misclassified product.' },
        value: { es: 'Hace la corrección permanente entre recolecciones, sin tocar los datos históricos.', en: 'Makes the correction permanent across collections, without touching historical data.' },
      },
      {
        name: 'source_category_id',
        type: 'int',
        nullable: false,
        fk: 'categories',
        what: { es: 'La categoría donde MercadoLibre lo puso por error.', en: 'The category where MercadoLibre mistakenly placed it.' },
        value: { es: 'Limpia las listas y conteos de esa categoría: mejora la precisión del análisis por nicho.', en: 'Cleans that category\'s lists and counts: improves per-niche analysis accuracy.' },
      },
      {
        name: 'target_subcategory_id',
        type: 'int',
        nullable: true,
        fk: 'global_subcategories',
        what: { es: 'Subcategoría universal correcta. Vacío = el producto solo se excluye (no pertenece a nada que midamos).', en: 'The correct universal subcategory. Empty = the product is only excluded (it belongs nowhere we measure).' },
        value: { es: 'El producto pasa a contar en el nicho donde realmente compite.', en: 'The product counts in the niche where it actually competes.' },
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        what: { es: 'Cuándo se hizo la corrección.', en: 'When the correction was made.' },
        value: { es: 'Registro del trabajo de curación.', en: 'Record of the curation work.' },
      },
    ],
  },

  // ── mercadolibre: operational ─────────────────────────────────────────────
  {
    id: 'staging_products',
    schema: 'mercadolibre',
    kind: 'operational',
    description: {
      es: 'Sala de espera entre las dos etapas de la recolección. Etapa 1: se leen las páginas de más vendidos y cada producto queda aquí "en bruto". Etapa 2: se completa con la información oficial de MercadoLibre y, recién cuando está completo, pasa a la tabla de productos y se borra de aquí. Así ningún producto llega a medias a los datos definitivos.',
      en: 'Waiting room between the two collection stages. Stage 1: the best-sellers pages are read and each product lands here "raw". Stage 2: it is completed with MercadoLibre\'s official information and, only once complete, moves to the products table and is removed from here. No product ever reaches the final data half-done.',
    },
    note: {
      es: 'Filas de corta vida; si una recolección se cae, el estado permite retomarla donde quedó.',
      en: 'Short-lived rows; if a collection crashes, the status lets it resume where it stopped.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK },
      { name: 'sync_run_id', type: 'varchar(100)', nullable: false, what: { es: 'Recolección a la que pertenece la fila.', en: 'Collection run this row belongs to.' } },
      { name: 'country', type: 'varchar(10)', nullable: false, what: { es: 'País que se está recolectando.', en: 'Country being collected.' } },
      { name: 'root_category_ml_id', type: 'varchar(50)', nullable: false, what: { es: 'Categoría principal del barrido.', en: 'Main category of the sweep.' } },
      { name: 'snapshot_date', type: 'timestamp', nullable: false, what: { es: 'Fecha que llevará la foto final del producto.', en: 'Date the product\'s final snapshot will carry.' } },
      { name: 'ml_public_id', type: 'varchar(50)', nullable: true, what: { es: 'Código de la publicación, si se pudo leer.', en: 'Listing code, if it could be read.' } },
      { name: 'catalog_id', type: 'varchar(50)', nullable: true, what: { es: 'Código de catálogo, si el producto tiene.', en: 'Catalog code, when the product has one.' } },
      { name: 'raw', type: 'json', nullable: false, what: { es: 'Los datos en bruto de la etapa 1 (todavía sin la información oficial).', en: 'The raw stage-1 data (official information not added yet).' } },
      { name: 'status', type: 'varchar(20)', nullable: false, what: { es: 'Estado: "pending" (en espera) o "failed" (falló) — controla la etapa 2.', en: 'Status: "pending" or "failed" — drives stage 2.' } },
      { name: 'error_msg', type: 'text', nullable: true, what: { es: 'Motivo del error, si lo hubo.', en: 'Error reason, if any.' } },
      { name: 'created_at', type: 'timestamp', nullable: false, what: { es: 'Cuándo entró a la sala de espera.', en: 'When it entered the waiting room.' } },
      { name: 'enriched_at', type: 'timestamp', nullable: true, what: { es: 'Cuándo terminó de completarse.', en: 'When its completion finished.' } },
    ],
  },
  {
    id: 'sync_progress',
    schema: 'mercadolibre',
    kind: 'operational',
    description: {
      es: 'Bitácora de avance de cada recolección, categoría por categoría: permite saber dónde va, dónde falló y retomar sin repetir el trabajo ya hecho.',
      en: 'Progress log of each collection, category by category: it shows where the run is, where it failed, and lets it resume without redoing finished work.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK },
      { name: 'sync_run_id', type: 'varchar(100)', nullable: false, what: { es: 'Identificador de la recolección; incluye país y fecha (ej. "MLC-2026-05-23…").', en: 'Collection identifier; includes country and date (e.g. "MLC-2026-05-23…").' } },
      { name: 'country', type: 'varchar(10)', nullable: false, what: { es: 'País de la categoría en proceso.', en: 'Country of the category being processed.' } },
      { name: 'category_ml_id', type: 'varchar(50)', nullable: false, what: { es: 'Categoría principal que se está recolectando.', en: 'Main category being collected.' } },
      { name: 'status', type: 'varchar(20)', nullable: false, what: { es: 'Estado: pendiente, en curso, terminada o fallida.', en: 'Status: pending, in progress, done or failed.' } },
      { name: 'error_msg', type: 'text', nullable: true, what: { es: 'Descripción del error cuando falló.', en: 'Error description when it failed.' } },
      { name: 'started_at', type: 'timestamp', nullable: true, what: { es: 'Cuándo comenzó esa categoría.', en: 'When that category started.' } },
      { name: 'completed_at', type: 'timestamp', nullable: true, what: { es: 'Cuándo terminó; junto al inicio da la duración.', en: 'When it finished; with the start it gives the duration.' } },
      { name: 'created_at', type: 'timestamp', nullable: false, what: { es: 'Cuándo se planificó (al iniciar la recolección).', en: 'When it was planned (at collection start).' } },
    ],
  },
  {
    id: 'failed_scraps',
    schema: 'mercadolibre',
    kind: 'operational',
    description: {
      es: 'Cuarentena: productos que llegaron incompletos (les faltó algún dato obligatorio, como el vendedor o el código de la publicación) y por eso NO se guardaron como foto. Suele pasar cuando la página de MercadoLibre cargó a medias.',
      en: 'Quarantine: products that arrived incomplete (missing some required piece, like the seller or the listing code) and therefore were NOT stored as a snapshot. It usually happens when the MercadoLibre page loaded halfway.',
    },
    columns: [
      { name: 'id', type: 'int', nullable: false, pk: true, what: INFRA_PK },
      { name: 'url', type: 'varchar(1000)', nullable: true, what: { es: 'Dirección web del producto que falló.', en: 'Web address of the failed product.' } },
      { name: 'country', type: 'varchar(10)', nullable: true, what: { es: 'País de la recolección.', en: 'Collection country.' } },
      { name: 'source_category_ml_id', type: 'varchar(50)', nullable: true, what: { es: 'Categoría del barrido de origen.', en: 'Category of the originating sweep.' } },
      { name: 'name', type: 'varchar(500)', nullable: true, what: { es: 'Título del producto, si alcanzó a leerse.', en: 'Product title, if it could be read at all.' } },
      { name: 'reason', type: 'varchar(100)', nullable: false, what: { es: 'Qué datos obligatorios faltaron.', en: 'Which required pieces were missing.' } },
      { name: 'data', type: 'json', nullable: false, what: { es: 'Todo lo que alcanzó a recolectarse, para diagnóstico o reproceso.', en: 'Everything that was collected, for diagnosis or re-processing.' } },
      { name: 'created_at', type: 'timestamp', nullable: false, what: { es: 'Cuándo ocurrió.', en: 'When it happened.' } },
    ],
  },
];

// Relations drawn in the diagram. Two products→categories FKs are merged into
// one edge to keep the drawing readable.
export const MARKET_RELATIONS: RelationDoc[] = [
  { from: 'global_subcategories', to: 'global_categories', kind: 'fk', label: 'global_category_id' },
  { from: 'categories', to: 'global_categories', kind: 'fk', label: 'global_category_id' },
  { from: 'categories', to: 'global_subcategories', kind: 'fk', label: 'global_subcategory_id' },
  { from: 'products', to: 'categories', kind: 'fk', label: 'category_id / parent_id' },
  { from: 'products', to: 'sellers', kind: 'fk', label: 'seller_id' },
  { from: 'product_category_overrides', to: 'categories', kind: 'fk', label: 'source_category_id' },
  { from: 'product_category_overrides', to: 'global_subcategories', kind: 'fk', label: 'target_subcategory_id' },
  { from: 'products', to: 'catalog_products', kind: 'soft', label: 'catalog_id' },
  { from: 'product_visits', to: 'products', kind: 'soft', label: 'canonical_id' },
  { from: 'tracked_products', to: 'products', kind: 'soft', label: "source='tracked'" },
  { from: 'staging_products', to: 'products', kind: 'soft', label: 'raw → snapshot' },
];

// Diagram lanes: each inner array is one column of stacked table nodes.
export const MARKET_LAYOUT: string[][] = [
  ['global_categories', 'global_subcategories'],
  ['categories', 'product_category_overrides', 'sync_progress'],
  ['products', 'staging_products', 'failed_scraps'],
  ['sellers', 'catalog_products', 'tracked_products', 'product_visits'],
];

export function tableById(id: string): TableDoc | undefined {
  return DB_TABLES.find((t) => t.id === id);
}
