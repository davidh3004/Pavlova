/**
 * Seed content for the local file-store.
 *
 * This mirrors the content the website was originally hardcoded with, so the
 * admin panel and the public site share one source of truth out of the box.
 * It is only used by the local JSON store (when Supabase is not configured);
 * Supabase deployments are seeded with `npm run seed`.
 */
import type { DbShape } from "./localStore";

function toMap(rows: any[]): Record<string, any> {
  const m: Record<string, any> = {};
  for (const r of rows) m[String(r.id)] = r;
  return m;
}

export function buildSeed(): DbShape {
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const categories = [
    { id: 1, name: "Desserts", nameEs: "Postres", slug: "desserts", sortOrder: 1 },
    { id: 2, name: "Savory Latin Bites", nameEs: "Bocados Latinos", slug: "savory", sortOrder: 2 },
    { id: 3, name: "Bakery", nameEs: "Panadería", slug: "bakery", sortOrder: 3 },
    { id: 4, name: "Coffee", nameEs: "Café", slug: "coffee", sortOrder: 4 },
  ];

  const products = [
    {
      id: 1, name: "The Tropical Grace Pavlova", nameEs: "La Pavlova Tropical Grace",
      description: "A symphony of textures featuring our signature crisp meringue, velvety whipped cream, and a vibrant selection of seasonal berries hand-picked each morning.",
      descriptionEs: "Una sinfonía de texturas con nuestro merengue crujiente, crema batida sedosa y una vibrante selección de frutos rojos de temporada recogidos cada mañana.",
      price: 4200, categoryId: 1, imageUrl: "/images/hero-pavlova.png", available: true, featured: true, sortOrder: 1, dietaryTags: [],
    },
    {
      id: 2, name: "Tres Leches Cake", nameEs: "Torta Tres Leches",
      description: "Venezuelan sponge cake soaked in three kinds of milk, finished with cinnamon.",
      descriptionEs: "Bizcocho venezolano bañado en tres tipos de leche, terminado con canela.",
      price: 650, categoryId: 1, imageUrl: "/images/signature-cake.png", available: true, featured: true, sortOrder: 2, dietaryTags: [],
    },
    {
      id: 3, name: "Chocolate Marquesa", nameEs: "Marquesa de Chocolate",
      description: "A no-bake layered chocolate delight made with María biscuits and rich cocoa cream.",
      descriptionEs: "Delicia de chocolate en capas, sin horno, con galletas María y crema de cacao.",
      price: 775, categoryId: 1, imageUrl: "/menu-images/dulce-de-leche-and-nutella-cake.jpg", available: true, featured: true, sortOrder: 3, dietaryTags: [],
    },
    {
      id: 4, name: "Cheesecake de Guayaba", nameEs: "Cheesecake de Guayaba",
      description: "Creamy cheesecake crowned with a bright tropical guava glaze.",
      descriptionEs: "Cheesecake cremoso coronado con un brillante glaseado tropical de guayaba.",
      price: 675, categoryId: 1, imageUrl: "/menu-images/cheesecake-parchito.jpg", available: true, featured: true, sortOrder: 4, dietaryTags: [],
    },
    {
      id: 5, name: "Alfajor Gourmet", nameEs: "Alfajor Gourmet",
      description: "Buttery shortbread cookies sandwiched with dulce de leche and rolled in coconut.",
      descriptionEs: "Galletas mantecosas rellenas de dulce de leche y bañadas en coco.",
      price: 350, categoryId: 1, imageUrl: "/menu-images/alfajor.jpg", available: true, featured: true, sortOrder: 5, dietaryTags: [],
    },
    {
      id: 6, name: "Mini Chocolate Cake", nameEs: "Mini Torta de Chocolate",
      description: "Rich, moist chocolate sponge layered with silky chocolate ganache.",
      descriptionEs: "Esponjoso bizcocho de chocolate en capas con sedoso ganache de chocolate.",
      price: 675, categoryId: 1, imageUrl: "/menu-images/chocolate-cake.jpg", available: true, featured: true, sortOrder: 6, dietaryTags: [],
    },
    {
      id: 7, name: "Carne Mechada Arepa", nameEs: "Arepa de Carne Mechada",
      description: "Hand-made white cornmeal pocket filled with slow-cooked shredded beef and savory spices.",
      descriptionEs: "Arepa de maíz blanco hecha a mano, rellena de carne mechada cocida a fuego lento.",
      price: 1200, categoryId: 2, imageUrl: "/menu-images/ropa-veja.jpg", available: true, featured: false, sortOrder: 7, dietaryTags: [],
    },
    {
      id: 8, name: "Tequeños", nameEs: "Tequeños",
      description: "Golden fried dough sticks wrapped around melted white cheese — the ultimate party bite.",
      descriptionEs: "Palitos de masa fritos y dorados rellenos de queso blanco — el antojito perfecto.",
      price: 800, categoryId: 2, imageUrl: "/menu-images/tequenos.jpg", available: true, featured: false, sortOrder: 8, dietaryTags: [],
    },
    {
      id: 9, name: "Empanada Venezolana", nameEs: "Empanada Venezolana",
      description: "Crispy cornmeal turnover filled with seasoned beef and a hint of sweet plantain.",
      descriptionEs: "Empanada de maíz crujiente rellena de carne sazonada y un toque de plátano dulce.",
      price: 450, categoryId: 2, imageUrl: "/menu-images/empanado-venezuela.jpg", available: true, featured: false, sortOrder: 9, dietaryTags: [],
    },
    {
      id: 10, name: "Milhojas", nameEs: "Milhojas",
      description: "Delicate layers of flaky puff pastry filled with smooth pastry cream.",
      descriptionEs: "Delicadas capas de hojaldre crujiente rellenas de suave crema pastelera.",
      price: 500, categoryId: 3, imageUrl: "/menu-images/milhojas.jpg", available: true, featured: false, sortOrder: 10, dietaryTags: [],
    },
    {
      id: 11, name: "Profiterol", nameEs: "Profiterol",
      description: "Airy choux pastry filled with cream and finished with a chocolate drizzle.",
      descriptionEs: "Esponjosa masa choux rellena de crema y terminada con un hilo de chocolate.",
      price: 450, categoryId: 3, imageUrl: "/menu-images/profiterol.jpg", available: true, featured: false, sortOrder: 11, dietaryTags: [],
    },
    {
      id: 12, name: "Café con Leche", nameEs: "Café con Leche",
      description: "Smooth espresso balanced with steamed milk — a Latin morning classic.",
      descriptionEs: "Espresso suave equilibrado con leche vaporizada — un clásico latino de la mañana.",
      price: 350, categoryId: 4, imageUrl: "/menu-images/cafe-con-leche.jpg", available: true, featured: false, sortOrder: 12, dietaryTags: [],
    },
    {
      id: 13, name: "Morning Combo", nameEs: "Combo Mañanero",
      description: "A freshly baked guava pastry paired with our signature barista-crafted house latte.",
      descriptionEs: "Pastelito de guayaba recién horneado con nuestro latte de la casa hecho por el barista.",
      price: 1050, categoryId: 4, imageUrl: "/images/coffee_pastries.png", available: true, featured: false, sortOrder: 13, dietaryTags: [],
    },
    {
      id: 14, name: "Caramel Iced Coffee", nameEs: "Café Helado de Caramelo",
      description: "Chilled cold brew swirled with silky caramel over ice.",
      descriptionEs: "Café frío mezclado con sedoso caramelo servido sobre hielo.",
      price: 500, categoryId: 4, imageUrl: "/menu-images/caramel-iced-coffee.jpg", available: true, featured: false, sortOrder: 14, dietaryTags: [],
    },
  ].map((p) => ({ ...p, createdAt: now }));

  const reviews = [
    {
      id: 1, author: "Maria G.", rating: 5,
      text: "The best Venezuelan desserts in Tampa! Everything is always fresh and amazing.",
      textEs: "¡Los mejores postres venezolanos de Tampa! Todo siempre fresco e increíble.",
      source: "Google", featured: true, sortOrder: 1, createdAt: now,
    },
    {
      id: 2, author: "Carlos M.", rating: 5,
      text: "We ordered catering for our wedding and it was absolutely perfect. Our guests loved it!",
      textEs: "Pedimos catering para nuestra boda y fue absolutamente perfecto. ¡A nuestros invitados les encantó!",
      source: "Google", featured: true, sortOrder: 2, createdAt: now,
    },
    {
      id: 3, author: "Jessica R.", rating: 5,
      text: "My new favorite spot for coffee, arepas and the mini cakes. 10/10!",
      textEs: "Mi nuevo lugar favorito para café, arepas y las mini tortas. ¡10/10!",
      source: "Google", featured: true, sortOrder: 3, createdAt: now,
    },
  ];

  const gallery = [
    { id: 1, title: "Signature Strawberry Pavlova", titleEs: "Pavlova de Fresa Insignia", imageUrl: "/gallery/large-strawberry-pavlova-flan.jpg", category: "desserts", sortOrder: 1, createdAt: now },
    { id: 2, title: "Individual Pavlova", titleEs: "Pavlova Individual", imageUrl: "/gallery/individual-pavlova-strawberries.jpg", category: "desserts", sortOrder: 2, createdAt: now },
    { id: 3, title: "Mixed Fruit Pavlova", titleEs: "Pavlova de Frutas Mixtas", imageUrl: "/gallery/fruit-pavlova-mixed.jpg", category: "desserts", sortOrder: 3, createdAt: now },
    { id: 4, title: "Dulce de Leche Cake", titleEs: "Torta de Dulce de Leche", imageUrl: "/gallery/dulce-de-leche-cake.jpg", category: "desserts", sortOrder: 4, createdAt: now },
    { id: 5, title: "Chocolate Cake Slice", titleEs: "Porción de Torta de Chocolate", imageUrl: "/gallery/chocolate-cake-slice.jpg", category: "desserts", sortOrder: 5, createdAt: now },
    { id: 6, title: "Milhojas Slice", titleEs: "Porción de Milhojas", imageUrl: "/gallery/milhojas-slice.jpg", category: "desserts", sortOrder: 6, createdAt: now },
    { id: 7, title: "Custom Number Pavlova", titleEs: "Pavlova Personalizada en Número", imageUrl: "/gallery/birthday-pavlova-number-8.jpg", category: "custom", sortOrder: 7, createdAt: now },
    { id: 8, title: "Celebration Pavlova with Flowers", titleEs: "Pavlova de Celebración con Flores", imageUrl: "/gallery/birthday-pavlova-flowers.jpg", category: "custom", sortOrder: 8, createdAt: now },
    { id: 9, title: "Quinceañera Dessert Table", titleEs: "Mesa de Postres Quinceañera", imageUrl: "/gallery/catering-quinceanera-table.jpg", category: "catering", sortOrder: 9, createdAt: now },
    { id: 10, title: "Event Catering Display", titleEs: "Exhibición de Catering para Eventos", imageUrl: "/gallery/catering-quinceanera-wide.jpg", category: "catering", sortOrder: 10, createdAt: now },
    { id: 11, title: "Berry Parfait Cups", titleEs: "Vasitos de Parfait de Frutos Rojos", imageUrl: "/gallery/catering-berry-parfaits.jpg", category: "catering", sortOrder: 11, createdAt: now },
    { id: 12, title: "Ropa Vieja Plate", titleEs: "Plato de Ropa Vieja", imageUrl: "/gallery/daily-menu-ropa-vieja.jpg", category: "savory", sortOrder: 12, createdAt: now },
    { id: 13, title: "Pork Chop with Congri", titleEs: "Chuleta con Congri", imageUrl: "/gallery/daily-menu-pork-chop.jpg", category: "savory", sortOrder: 13, createdAt: now },
    { id: 14, title: "Steak & Egg Sandwich", titleEs: "Sándwich de Bistec y Huevo", imageUrl: "/gallery/daily-menu-steak-sandwich.jpg", category: "savory", sortOrder: 14, createdAt: now },
    { id: 15, title: "Tequeños", titleEs: "Tequeños", imageUrl: "/gallery/tequenos-plate.jpg", category: "savory", sortOrder: 15, createdAt: now },
    { id: 16, title: "Fresh from Our Kitchen", titleEs: "Recién Salido de Nuestra Cocina", imageUrl: "/gallery/pavlova-branding-takeout.jpg", category: "cafe", sortOrder: 16, createdAt: now },
    { id: 17, title: "Birthday Strawberry Pavlova", titleEs: "Pavlova de Cumpleaños", imageUrl: "/gallery/birthday-pavlova-gold-topper.jpg", category: "custom", sortOrder: 17, createdAt: now },
    { id: 18, title: "Number 8 Birthday Pavlova", titleEs: "Pavlova Número 8", imageUrl: "/gallery/birthday-pavlova-8-topdown.jpg", category: "custom", sortOrder: 18, createdAt: now },
  ];

  const siteSettings = [
    {
      id: 1,
      businessName: "Pavlova Love Tampa",
      address: "3909 W Broad St, Tampa, FL 33614",
      phone: "(407) 419-7137",
      email: "hello@pavlovalovetampa.com",
      hours: "Tue–Sun 9am–7pm · Mon Closed",
      instagram: "https://www.instagram.com/pavlovalovetampa/",
      facebook: "https://www.facebook.com/p/Pavlovalovetampa-100064058713044/",
      tiktok: "https://www.tiktok.com/@pavlovalovetampa0",
      whatsapp: "+14074197137",
      bakesy: "https://bakesy.shop",
    },
  ];

  const promotions = [
    {
      id: 1, code: "WELCOME10", name: "Welcome Offer", description: "10% off your first online order.",
      discountType: "percentage", discountValue: 10, minimumOrder: null,
      active: true, usageLimit: null, usageCount: 0, startsAt: null, expiresAt: null, createdAt: now,
    },
  ];

  // ── Daily menu (today) ──────────────────────────────────────────
  const menus = [
    { id: 1, date: today, title: "Today's Fresh Menu", titleEs: "Menú Fresco de Hoy", published: true, note: "Hand-picked favorites, made fresh this morning.", noteEs: "Favoritos seleccionados, hechos frescos esta mañana.", createdAt: now },
  ];
  const menuSections = [
    { id: 1, menuId: 1, title: "Sweet", titleEs: "Dulce", sortOrder: 1 },
    { id: 2, menuId: 1, title: "Savory", titleEs: "Salado", sortOrder: 2 },
  ];
  const menuItems = [
    { id: 1, menuId: 1, sectionId: 1, productId: 2, name: "Tres Leches Cake", nameEs: "Torta Tres Leches", description: "Today's batch, extra moist.", descriptionEs: "Lote de hoy, extra húmedo.", price: 650, imageUrl: "/images/signature-cake.png", available: true, soldOut: false, featured: true, sortOrder: 1, createdAt: now },
    { id: 2, menuId: 1, sectionId: 1, productId: 4, name: "Cheesecake de Guayaba", nameEs: "Cheesecake de Guayaba", description: "With fresh guava glaze.", descriptionEs: "Con glaseado de guayaba fresca.", price: 675, imageUrl: "/menu-images/cheesecake-parchito.jpg", available: true, soldOut: false, featured: false, sortOrder: 2, createdAt: now },
    { id: 3, menuId: 1, sectionId: 2, productId: 7, name: "Carne Mechada Arepa", nameEs: "Arepa de Carne Mechada", description: "Slow-cooked shredded beef.", descriptionEs: "Carne mechada cocida a fuego lento.", price: 1200, imageUrl: "/menu-images/ropa-veja.jpg", available: true, soldOut: false, featured: true, sortOrder: 1, createdAt: now },
    { id: 4, menuId: 1, sectionId: 2, productId: 8, name: "Tequeños", nameEs: "Tequeños", description: "Fresh from the fryer.", descriptionEs: "Recién salidos de la freidora.", price: 800, imageUrl: "/menu-images/tequenos.jpg", available: true, soldOut: false, featured: false, sortOrder: 2, createdAt: now },
  ];

  return {
    collections: {
      categories: toMap(categories),
      products: toMap(products),
      reviews: toMap(reviews),
      gallery_items: toMap(gallery),
      promotions: toMap(promotions),
      site_settings: toMap(siteSettings),
      menus: toMap(menus),
      menu_sections: toMap(menuSections),
      menu_items: toMap(menuItems),
    },
    counters: {
      categories: categories.length,
      products: products.length,
      reviews: reviews.length,
      gallery_items: gallery.length,
      promotions: promotions.length,
      site_settings: siteSettings.length,
      menus: menus.length,
      menu_sections: menuSections.length,
      menu_items: menuItems.length,
    },
  };
}
