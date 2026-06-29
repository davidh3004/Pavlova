import { useState, useEffect } from 'react';

interface MenuItem { id?: number; name: string; nameEs: string; price?: number; description?: string; featured: boolean; soldOut: boolean; sortOrder: number; }
interface MenuSection { id?: number; name: string; nameEs: string; sortOrder: number; items: MenuItem[]; }
interface DailyMenu { id?: number; date: string; published: boolean; notes?: string; sections: MenuSection[]; }

const TODAY = new Date().toISOString().split('T')[0];

export default function AdminMenu() {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [menu, setMenu] = useState<DailyMenu|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menus');
      if (res.ok) setMenus(await res.json());
    } finally { setLoading(false); }
  };

  const loadDate = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menus/date/${date}`);
      if (res.ok) { setMenu(await res.json()); }
      else { setMenu({ date, published: false, notes: '', sections: [] }); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadMenus(); loadDate(TODAY); }, []);

  const save = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      const url = menu.id ? `/api/menus/${menu.id}` : '/api/menus';
      const method = menu.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(menu) });
      if (res.ok) { const saved = await res.json(); setMenu(saved); loadMenus(); }
    } finally { setSaving(false); }
  };

  const addSection = () => {
    if (!menu) return;
    setMenu({...menu, sections: [...menu.sections, { name:'', nameEs:'', sortOrder: menu.sections.length, items:[] }]});
  };

  const addItem = (si: number) => {
    if (!menu) return;
    const sections = [...menu.sections];
    sections[si] = {...sections[si], items: [...sections[si].items, { name:'', nameEs:'', featured:false, soldOut:false, sortOrder: sections[si].items.length }]};
    setMenu({...menu, sections});
  };

  const updateSection = (si: number, field: string, val: any) => {
    if (!menu) return;
    const sections = [...menu.sections];
    sections[si] = {...sections[si], [field]: val};
    setMenu({...menu, sections});
  };

  const updateItem = (si: number, ii: number, field: string, val: any) => {
    if (!menu) return;
    const sections = [...menu.sections];
    const items = [...sections[si].items];
    items[ii] = {...items[ii], [field]: val};
    sections[si] = {...sections[si], items};
    setMenu({...menu, sections});
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
                    onChange={e => setMenu({...menu, published: e.target.checked})} />
                </label>
              </div>
              <div className="form-control mt-2">
                <label className="label"><span className="label-text text-sm">Notes (optional)</span></label>
                <input className="input input-bordered input-sm" value={menu.notes||''} onChange={e => setMenu({...menu, notes:e.target.value})} placeholder="e.g. Limited quantities today!" />
              </div>
            </div>
          </div>

          {/* Sections */}
          {menu.sections.map((section, si) => (
            <div key={si} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="input input-bordered input-sm" placeholder="Section name (EN)" value={section.name} onChange={e => updateSection(si, 'name', e.target.value)} />
                  <input className="input input-bordered input-sm" placeholder="Section name (ES)" value={section.nameEs} onChange={e => updateSection(si, 'nameEs', e.target.value)} />
                </div>
                {section.items.map((item, ii) => (
                  <div key={ii} className="grid grid-cols-12 gap-2 items-start py-2 border-t border-base-200">
                    <input className="input input-bordered input-xs col-span-3" placeholder="Name (EN)" value={item.name} onChange={e => updateItem(si,ii,'name',e.target.value)} />
                    <input className="input input-bordered input-xs col-span-3" placeholder="Name (ES)" value={item.nameEs} onChange={e => updateItem(si,ii,'nameEs',e.target.value)} />
                    <input className="input input-bordered input-xs col-span-2" placeholder="Price $" type="number" step="0.01" value={item.price ? item.price/100 : ''} onChange={e => updateItem(si,ii,'price',parseFloat(e.target.value)*100||0)} />
                    <label className="flex items-center gap-1 col-span-2 text-xs cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={item.featured} onChange={e => updateItem(si,ii,'featured',e.target.checked)} />
                      Featured
                    </label>
                    <label className="flex items-center gap-1 col-span-2 text-xs cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-error" checked={item.soldOut} onChange={e => updateItem(si,ii,'soldOut',e.target.checked)} />
                      Sold Out
                    </label>
                  </div>
                ))}
                <button className="btn btn-ghost btn-xs mt-2" onClick={() => addItem(si)}>+ Add Item</button>
              </div>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={addSection}>+ Add Section</button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📋</div>
          <p className="font-medium">No menu for this date</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => setMenu({ date: selectedDate, published: false, notes: '', sections: [] })}>
            Create Menu
          </button>
        </div>
      )}
    </div>
  );
}
