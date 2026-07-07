import { useState, useEffect, useMemo } from 'react';

interface Category {
  id: number;
  name: string;
  nameEs: string;
  slug?: string | null;
  sortOrder: number;
}

const EMPTY = { name: '', nameEs: '', slug: '', sortOrder: 0 };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: number }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (prodRes.ok) {
        const products: { categoryId?: number }[] = await prodRes.json();
        const counts: Record<number, number> = {};
        for (const p of products) {
          if (p.categoryId) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
        }
        setProductCounts(counts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const nextSortOrder = useMemo(
    () => categories.reduce((m, c) => Math.max(m, c.sortOrder ?? 0), 0) + 1,
    [categories],
  );

  const openCreate = () => {
    setForm({ ...EMPTY, sortOrder: nextSortOrder });
    setModal('create');
  };

  const openEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      nameEs: c.nameEs ?? '',
      slug: c.slug ?? '',
      sortOrder: c.sortOrder ?? 0,
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug.trim() || slugify(form.name);
      const payload = {
        name: form.name.trim(),
        nameEs: form.nameEs.trim(),
        slug,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = form.id ? `/api/categories/${form.id}` : '/api/categories';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setModal(null);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setDeleteError('');
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      await load();
      return;
    }
    const data = await res.json().catch(() => null);
    setDeleteError(data?.error ?? 'Could not delete this category.');
  };

  const deleteTarget = deleteId ? categories.find(c => c.id === deleteId) : null;
  const deleteCount = deleteId ? productCounts[deleteId] ?? 0 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Categories</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Organize products on the order page. Remove products from a category before deleting it.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : categories.length === 0 ? (
        <div className="card bg-base-100 p-12 text-center text-base-content/40">
          <p>No categories yet.</p>
          <button type="button" className="btn btn-primary btn-sm mt-4" onClick={openCreate}>
            Add your first category
          </button>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name (EN)</th>
                  <th>Name (ES)</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} className="hover">
                    <td className="text-base-content/50 w-16">{c.sortOrder}</td>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-sm text-base-content/70">{c.nameEs || '—'}</td>
                    <td className="font-mono text-xs text-base-content/60">{c.slug || '—'}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{productCounts[c.id] ?? 0}</span>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => { setDeleteError(''); setDeleteId(c.id); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-serif text-xl font-bold mb-4">
              {modal === 'create' ? 'Add Category' : 'Edit Category'}
            </h3>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Name (EN)</span></label>
                <input
                  className="input input-bordered"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Desserts & Pavlovas"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Name (ES)</span></label>
                <input
                  className="input input-bordered"
                  value={form.nameEs}
                  onChange={e => setForm({ ...form, nameEs: e.target.value })}
                  placeholder="Postres y Pavlovas"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Slug</span></label>
                <input
                  className="input input-bordered font-mono text-sm"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder={slugify(form.name) || 'desserts'}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">Used in URLs; auto-generated from name if left blank.</span>
                </label>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Display order</span></label>
                <input
                  type="number"
                  min={0}
                  className="input input-bordered"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setModal(null)}></div>
        </div>
      )}

      {deleteId && deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg">Delete category?</h3>
            <p className="py-3 text-sm text-base-content/70">
              Remove <strong>{deleteTarget.name}</strong>?
              {deleteCount > 0 && (
                <span className="block mt-2 text-error">
                  This category has {deleteCount} product{deleteCount === 1 ? '' : 's'}. Reassign or remove them first.
                </span>
              )}
            </p>
            {deleteError && (
              <p className="text-sm text-error mb-2">{deleteError}</p>
            )}
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-error"
                disabled={deleteCount > 0}
                onClick={() => remove(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)}></div>
        </div>
      )}
    </div>
  );
}
