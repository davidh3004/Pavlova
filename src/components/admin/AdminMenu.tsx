import { useState, useEffect } from 'react';

interface MenuItem { id?: number; productId?: number | null; name: string; nameEs: string; price?: number; description?: string; imageUrl?: string | null; featured: boolean; soldOut: boolean; sortOrder: number; }
interface MenuSection { id?: number; title: string; titleEs: string; sortOrder: number; items: MenuItem[]; }
interface DailyMenu { id?: number; date: string; title?: string; titleEs?: string; published: boolean; note?: string; sections: MenuSection[]; }
interface Product { id: number; name: string; nameEs?: string; price?: string | number; description?: string; descriptionEs?: string; imageUrl?: string | null; categoryName?: string; }

const TODAY = new Date().toISOString().split('T')[0];

/** Normalizes a menu coming from the API into the editor's working shape. */
function normalize(data: any, fallbackDate: string): DailyMenu {
  return {
    id: data?.id,
    date: data?.date ?? fallbackDate,
    title: data?.title ?? '',
    titleEs: data?.titleEs ?? '',
    published: Boolean(data?.published),
    note: data?.note ?? data?.notes ?? '',
    sections: Array.isArray(data?.sections)
      ? data.sections.map((s: any, si: number) => ({
          id: s.id,
          title: s.title ?? s.name ?? '',
          titleEs: s.titleEs ?? s.nameEs ?? '',
          sortOrder: s.sortOrder ?? si,
          items: Array.isArray(s.items)
            ? s.items.map((it: any, ii: number) => ({
                id: it.id,
                productId: it.productId ?? null,
                name: it.name ?? '',
                nameEs: it.nameEs ?? '',
                price: Number(it.price) || 0,
                description: it.description ?? '',
                imageUrl: it.imageUrl ?? null,
                featured: Boolean(it.featured),
                soldOut: Boolean(it.soldOut),
                sortOrder: it.sortOrder ?? ii,
              }))
            : [],
        }))
      : [],
  };
}

export default function AdminMenu() {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMenus = async () => {
    try {
      const res = await fetch('/api/menus');
      if (res.ok) setMenus(await res.json());
    } catch { /* ignore */ }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch { /* ignore */ }
  };

  const loadDate = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menus/date/${date}`);
      if (res.ok) setMenu(normalize(await res.json(), date));
      else setMenu(null);
    } catch {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMenus(); loadProducts(); loadDate(TODAY); }, []);

  const save = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      const url = menu.id ? `/api/menus/${menu.id}` : '/api/menus';
      const method = menu.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(menu) });
      if (res.ok) {
        setMenu(normalize(await res.json(), menu.date));
        loadMenus();
      } else {
        alert('Failed to save the menu. Please try again.');
      }
    } catch {
      alert('Failed to save the menu. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createMenu = () => setMenu({ date: selectedDate, title: '', titleEs: '', published: false, note: '', sections: [] });

  const addSection = () => {
    if (!menu) return;
    setMenu({ ...menu, sections: [...menu.sections, { title: '', titleEs: '', sortOrder: menu.sections.length, items: [] }] });
  };

  const addItemFromProduct = (si: number, productId: number) => {
    if (!menu) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const sections = [...menu.sections];
    const item: MenuItem = {
      productId: product.id,
      name: product.name ?? '',
      nameEs: product.nameEs ?? '',
      price: Number(product.price) || 0,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? null,
      featured: false,
      soldOut: false,
      sortOrder: sections[si].items.length,
    };
    sections[si] = { ...sections[si], items: [...sections[si].items, item] };
    setMenu({ ...menu, sections });
  };

  const updateSection = (si: number, field: string, val: any) => {
    if (!menu) return;
    const sections = [...menu.sections];
    sections[si] = { ...sections[si], [field]: val };
    setMenu({ ...menu, sections });
  };

  const removeSection = (si: number) => {
    if (!menu) return;
    setMenu({ ...menu, sections: menu.sections.filter((_, i) => i !== si) });
  };

  const updateItem = (si: number, ii: number, field: string, val: any) => {
    if (!menu) return;
    const sections = [...menu.sections];
    const items = [...sections[si].items];
    items[ii] = { ...items[ii], [field]: val };
    sections[si] = { ...sections[si], items };
    setMenu({ ...menu, sections });
  };

  const removeItem = (si: number, ii: number) => {
    if (!menu) return;
    const sections = [...menu.sections];
    sections[si] = { ...sections[si], items: sections[si].items.filter((_, i) => i !== ii) };
    setMenu({ ...menu, sections });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-bold">Daily Menu</h1>
        <div className="flex items-center gap-3">
          <input type="date" className="input input-bordered input-sm" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); loadDate(e.target.value); }} />
          {menu && (
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Menu'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : menu ? (
        <div className="space-y-6">
          {/* Menu header */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Menu for {menu.date}</h2>
                  {menu.id && <p className="text-xs text-base-content/40">ID: {menu.id}</p>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-medium">Published</span>
                  <input type="checkbox" className="toggle toggle-success" checked={menu.published}
                    onChange={e => setMenu({ ...menu, published: e.target.checked })} />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Title (EN)</span></label>
                  <input className="input input-bordered input-sm" value={menu.title || ''} onChange={e => setMenu({ ...menu, title: e.target.value })} placeholder="e.g. Today's Menu" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Title (ES)</span></label>
                  <input className="input input-bordered input-sm" value={menu.titleEs || ''} onChange={e => setMenu({ ...menu, titleEs: e.target.value })} placeholder="e.g. Menú del Día" />
                </div>
              </div>
              <div className="form-control mt-2">
                <label className="label"><span className="label-text text-sm">Notes (optional)</span></label>
                <input className="input input-bordered input-sm" value={menu.note || ''} onChange={e => setMenu({ ...menu, note: e.target.value })} placeholder="e.g. Limited quantities today!" />
              </div>
            </div>
          </div>

          {/* Sections */}
          {menu.sections.map((section, si) => (
            <div key={si} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="grid grid-cols-12 gap-3 mb-3 items-center">
                  <input className="input input-bordered input-sm col-span-5" placeholder="Section name (EN)" value={section.title} onChange={e => updateSection(si, 'title', e.target.value)} />
                  <input className="input input-bordered input-sm col-span-5" placeholder="Section name (ES)" value={section.titleEs} onChange={e => updateSection(si, 'titleEs', e.target.value)} />
                  <button className="btn btn-ghost btn-xs col-span-2 text-error" onClick={() => removeSection(si)}>Remove</button>
                </div>
                {section.items.map((item, ii) => (
                  <div key={ii} className="grid grid-cols-12 gap-2 items-center py-2 border-t border-base-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="col-span-1 w-9 h-9 rounded object-cover" />
                    ) : (
                      <div className="col-span-1 w-9 h-9 rounded bg-base-200 grid place-items-center text-base-content/30 text-xs">—</div>
                    )}
                    <input className="input input-bordered input-xs col-span-3" placeholder="Name (EN)" value={item.name} onChange={e => updateItem(si, ii, 'name', e.target.value)} />
                    <input className="input input-bordered input-xs col-span-2" placeholder="Name (ES)" value={item.nameEs} onChange={e => updateItem(si, ii, 'nameEs', e.target.value)} />
                    <input className="input input-bordered input-xs col-span-2" placeholder="Price $" type="number" step="0.01" value={item.price ? item.price / 100 : ''} onChange={e => updateItem(si, ii, 'price', Math.round(parseFloat(e.target.value) * 100) || 0)} />
                    <label className="flex items-center gap-1 col-span-2 text-xs cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={item.featured} onChange={e => updateItem(si, ii, 'featured', e.target.checked)} />
                      Featured
                    </label>
                    <label className="flex items-center gap-1 col-span-1 text-xs cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-error" checked={item.soldOut} onChange={e => updateItem(si, ii, 'soldOut', e.target.checked)} />
                      Out
                    </label>
                    <button className="btn btn-ghost btn-xs col-span-1 text-error" onClick={() => removeItem(si, ii)}>✕</button>
                  </div>
                ))}
                <div className="mt-3 border-t border-base-200 pt-3">
                  <select
                    className="select select-bordered select-sm w-full max-w-md"
                    value=""
                    onChange={e => { const id = Number(e.target.value); if (id) addItemFromProduct(si, id); e.target.value = ''; }}
                  >
                    <option value="">+ Add a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.categoryName ? ` — ${p.categoryName}` : ''}{p.price ? ` ($${(Number(p.price) / 100).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                  {products.length === 0 && (
                    <p className="text-xs text-base-content/40 mt-1">No products found. Add products in the Products section first.</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={addSection}>+ Add Section</button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📋</div>
          <p className="font-medium">No menu for this date</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={createMenu}>
            Create Menu
          </button>
        </div>
      )}
    </div>
  );
}
