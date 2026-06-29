import { COL, getById, queryEq } from "./store";

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
