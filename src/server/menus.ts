import { COL, getById, queryEq, create, removeWhere } from "./store";

/**
 * Replaces all sections + items for a menu with the provided nested array.
 * Accepts both the canonical (`title`/`titleEs`) and legacy (`name`/`nameEs`)
 * field names so older payloads keep working.
 */
export async function saveMenuSections(menuId: number, sections: any[] = []): Promise<void> {
  await Promise.all([
    removeWhere(COL.menuSections, "menuId", menuId),
    removeWhere(COL.menuItems, "menuId", menuId),
  ]);

  for (let si = 0; si < sections.length; si++) {
    const s = sections[si] ?? {};
    const section = await create(COL.menuSections, {
      menuId,
      title: s.title ?? s.name ?? "",
      titleEs: s.titleEs ?? s.nameEs ?? null,
      sortOrder: s.sortOrder ?? si,
    });

    const items = Array.isArray(s.items) ? s.items : [];
    for (let ii = 0; ii < items.length; ii++) {
      const it = items[ii] ?? {};
      await create(COL.menuItems, {
        menuId,
        sectionId: section.id,
        productId: it.productId ?? null,
        name: it.name ?? "",
        nameEs: it.nameEs ?? null,
        description: it.description ?? null,
        descriptionEs: it.descriptionEs ?? null,
        price: Number(it.price) || 0,
        imageUrl: it.imageUrl ?? null,
        available: it.available ?? true,
        soldOut: it.soldOut ?? false,
        featured: it.featured ?? false,
        sortOrder: it.sortOrder ?? ii,
      });
    }
  }
}

/** Builds the nested menu → sections → items shape the frontend expects. */
export async function getMenuWithItems(menuId: number): Promise<any> {
  const menu = await getById(COL.menus, menuId);
  if (!menu) return null;

  const [sections, items] = await Promise.all([
    queryEq(COL.menuSections, "menuId", menu.id, { orderBy: "sortOrder", dir: "asc" }),
    queryEq(COL.menuItems, "menuId", menu.id, { orderBy: "sortOrder", dir: "asc" }),
  ]);

  return {
    ...menu,
    date: menu.date,
    createdAt: menu.createdAt,
    sections: sections.map((section) => ({
      ...section,
      items: items
        .filter((item) => item.sectionId === section.id)
        .map((item) => ({ ...item, price: String(item.price) })),
    })),
  };
}
