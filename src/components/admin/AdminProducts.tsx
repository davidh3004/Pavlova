import { useState, useEffect } from 'react';

interface Category { id: number; name: string; nameEs: string; }
interface Product {
  id: number; name: string; nameEs: string; description?: string; descriptionEs?: string;
  price: number; imageUrl?: string; available: boolean; categoryId?: number; sortOrder?: number;
}

const EMPTY: Omit<Product,'id'> = { name:'', nameEs:'', description:'', descriptionEs:'', price:0, imageUrl:'', available:true, categoryId:undefined };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [form, setForm] = useState<Omit<Product,'id'>&{id?:number}>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
      if (p.ok) setProducts(await p.json());
      if (c.ok) setCategories(await c.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const url = form.id ? `/api/products/${form.id}` : '/api/products';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify({...form, price: Math.round(form.price * 100)}) });
      if (res.ok) { setModal(null); load(); }
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  };

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (p: Product) => { setForm({...p, price: p.price/100}); setModal('edit'); };
  const fmtPrice = (c: number) => `$${(c/100).toFixed(2)}`;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nameEs.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-bold">Products</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="mb-4">
        <input className="input input-bordered w-full max-w-sm" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="hover">
                    <td>
                      {p.imageUrl ? (
                        <div className="avatar"><div className="w-12 h-12 rounded-lg"><img src={p.imageUrl} alt={p.name} className="object-cover" /></div></div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center text-xl">🍰</div>
                      )}
                    </td>
                    <td>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-base-content/50">{p.nameEs}</div>
                    </td>
                    <td className="text-sm">{categories.find(c=>c.id===p.categoryId)?.name || '—'}</td>
                    <td className="font-bold">{fmtPrice(p.price)}</td>
                    <td>
                      <input type="checkbox" className="toggle toggle-success toggle-sm" checked={p.available}
                        onChange={async () => {
                          await fetch(`/api/products/${p.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({available: !p.available}) });
                          setProducts(prev => prev.map(x => x.id===p.id ? {...x, available:!x.available} : x));
                        }}
                      />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-serif text-xl font-bold mb-4">{modal === 'create' ? 'Add Product' : 'Edit Product'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Name (EN)</span></label>
                <input className="input input-bordered" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Name (ES)</span></label>
                <input className="input input-bordered" value={form.nameEs} onChange={e => setForm({...form, nameEs:e.target.value})} />
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Description (EN)</span></label>
                <textarea className="textarea textarea-bordered" rows={2} value={form.description||''} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Description (ES)</span></label>
                <textarea className="textarea textarea-bordered" rows={2} value={form.descriptionEs||''} onChange={e => setForm({...form, descriptionEs:e.target.value})} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Price ($)</span></label>
                <input type="number" step="0.01" min="0" className="input input-bordered" value={form.price} onChange={e => setForm({...form, price:parseFloat(e.target.value)||0})} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category</span></label>
                <select className="select select-bordered" value={form.categoryId||''} onChange={e => setForm({...form, categoryId:e.target.value ? Number(e.target.value) : undefined})}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Image URL</span></label>
                <input className="input input-bordered" value={form.imageUrl||''} onChange={e => setForm({...form, imageUrl:e.target.value})} placeholder="/menu-images/..." />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <span className="label-text">Available</span>
                  <input type="checkbox" className="toggle toggle-success" checked={form.available} onChange={e => setForm({...form, available:e.target.checked})} />
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setModal(null)}></div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg">Delete Product?</h3>
            <p className="py-4 text-sm text-base-content/70">This action cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-error" onClick={() => remove(deleteId)}>Delete</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)}></div>
        </div>
      )}
    </div>
  );
}
