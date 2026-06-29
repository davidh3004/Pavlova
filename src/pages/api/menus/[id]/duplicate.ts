import type { APIRoute } from "astro";
import { COL, create } from "@/server/store";
import { json, error, readBody, run, toNumber } from "@/server/http";
import { getMenuWithItems } from "@/server/menus";

export const POST: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    if (!body.targetDate) return error("targetDate is required");

    const original = await getMenuWithItems(id);
    if (!original) return error("Not found", 404);

    const newMenu = await create(COL.menus, {
      date: body.targetDate,
      title: original.title,
      titleEs: original.titleEs,
      published: false,
      note: original.note,
      noteEs: original.noteEs,
    });

    for (const section of original.sections) {
      const newSection = await create(COL.menuSections, {
        menuId: newMenu.id,
        name: section.name,
        nameEs: section.nameEs,
        sortOrder: section.sortOrder,
      });
      for (const item of section.items) {
        await create(COL.menuItems, {
          menuId: newMenu.id,
          sectionId: newSection.id,
          productId: item.productId ?? null,
          name: item.name,
          nameEs: item.nameEs,
          description: item.description,
          descriptionEs: item.descriptionEs,
          price: item.price,
          imageUrl: item.imageUrl,
          available: item.available,
          soldOut: false,
          featured: item.featured,
          sortOrder: item.sortOrder,
        });
      }
    }

    return json({ ...newMenu, date: newMenu.date, createdAt: newMenu.createdAt }, 201);
  });
