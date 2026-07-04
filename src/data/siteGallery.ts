/** Static gallery catalog — used as fallback when the database has no gallery items. */
export interface SiteGalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  captionEs: string;
  category: string;
  sortOrder: number;
}

export const SITE_GALLERY: SiteGalleryItem[] = [
  { id: 1, imageUrl: '/gallery/large-strawberry-pavlova-flan.jpg', caption: 'Signature Strawberry Pavlova', captionEs: 'Pavlova de Fresa Insignia', category: 'desserts', sortOrder: 1 },
  { id: 2, imageUrl: '/gallery/individual-pavlova-strawberries.jpg', caption: 'Individual Pavlova', captionEs: 'Pavlova Individual', category: 'desserts', sortOrder: 2 },
  { id: 3, imageUrl: '/gallery/fruit-pavlova-mixed.jpg', caption: 'Mixed Fruit Pavlova', captionEs: 'Pavlova de Frutas Mixtas', category: 'desserts', sortOrder: 3 },
  { id: 4, imageUrl: '/gallery/pavlova-branding-takeout.jpg', caption: 'Fresh from Our Kitchen', captionEs: 'Recién Salido de Nuestra Cocina', category: 'desserts', sortOrder: 4 },
  { id: 5, imageUrl: '/gallery/dulce-de-leche-cake.jpg', caption: 'Dulce de Leche Cake', captionEs: 'Torta de Dulce de Leche', category: 'desserts', sortOrder: 5 },
  { id: 6, imageUrl: '/gallery/chocolate-cake-slice.jpg', caption: 'Chocolate Cake Slice', captionEs: 'Porción de Torta de Chocolate', category: 'desserts', sortOrder: 6 },
  { id: 7, imageUrl: '/gallery/milhojas-slice.jpg', caption: 'Milhojas Slice', captionEs: 'Porción de Milhojas', category: 'desserts', sortOrder: 7 },
  { id: 8, imageUrl: '/gallery/birthday-pavlova-number-8.jpg', caption: 'Custom Number Pavlova', captionEs: 'Pavlova Personalizada en Número', category: 'custom', sortOrder: 8 },
  { id: 9, imageUrl: '/gallery/birthday-pavlova-flowers.jpg', caption: 'Celebration Pavlova with Flowers', captionEs: 'Pavlova de Celebración con Flores', category: 'custom', sortOrder: 9 },
  { id: 10, imageUrl: '/gallery/birthday-pavlova-gold-topper.jpg', caption: 'Birthday Strawberry Pavlova', captionEs: 'Pavlova de Cumpleaños', category: 'custom', sortOrder: 10 },
  { id: 11, imageUrl: '/gallery/birthday-pavlova-8-topdown.jpg', caption: 'Number 8 Birthday Pavlova', captionEs: 'Pavlova Número 8', category: 'custom', sortOrder: 11 },
  { id: 12, imageUrl: '/gallery/catering-quinceanera-table.jpg', caption: 'Quinceañera Dessert Table', captionEs: 'Mesa de Postres Quinceañera', category: 'catering', sortOrder: 12 },
  { id: 13, imageUrl: '/gallery/catering-quinceanera-wide.jpg', caption: 'Event Catering Display', captionEs: 'Exhibición de Catering para Eventos', category: 'catering', sortOrder: 13 },
  { id: 14, imageUrl: '/gallery/catering-berry-parfaits.jpg', caption: 'Berry Parfait Cups', captionEs: 'Vasitos de Parfait de Frutos Rojos', category: 'catering', sortOrder: 14 },
  { id: 15, imageUrl: '/gallery/daily-menu-ropa-vieja.jpg', caption: 'Ropa Vieja with Rice & Plantains', captionEs: 'Ropa Vieja con Arroz y Maduros', category: 'savory', sortOrder: 15 },
  { id: 16, imageUrl: '/gallery/daily-menu-pork-chop.jpg', caption: 'Pork Chop with Congri', captionEs: 'Chuleta con Congri', category: 'savory', sortOrder: 16 },
  { id: 17, imageUrl: '/gallery/daily-menu-steak-sandwich.jpg', caption: 'Steak & Egg Sandwich', captionEs: 'Sándwich de Bistec y Huevo', category: 'savory', sortOrder: 17 },
  { id: 18, imageUrl: '/gallery/tequenos-plate.jpg', caption: 'Tequeños', captionEs: 'Tequeños', category: 'savory', sortOrder: 18 },
];
