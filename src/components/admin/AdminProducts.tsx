import { useState, useEffect, useMemo, useCallback } from 'react';

interface Category { id: number; name: string; nameEs: string; }
interface Product {
  id: number; name: string; nameEs: string; description?: string; descriptionEs?: string;
  price: number; imageUrl?: string; available: boolean; featured?: boolean;
  categoryId?: number; sortOrder?: number;
}

type Tab = 'products' | 'signature' | 'order';

const EMPTY: Omit<Product, 'id'> = {
  name: '', nameEs: '', description: '', descriptionEs: '', price: 0,
  imageUrl: '', available: true, featured: false, categoryId: undefined, sortOrder: 0,
};

async function saveReorder(updates: { id: number; sortOrder?: number; featured?: boolean }[]) {
  await fetch('/api/products/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
}

function renumberSortOrder(list: Product[]): { id: number; sortOrder: number }[] {
  return list.map((p, i) => ({ id: p.id, sortOrder: i + 1 }));
}

function reorderListItems(list: Product[], from: number, to: number): Product[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function dragRowClass(dragIndex: number | null, dropIndex: number | null, i: number) {
  return [
    'cursor-grab active:cursor-grabbing select-none',
    dragIndex === i ? 'opacity-40' : '',
    dropIndex === i && dragIndex !== i ? 'border-t-2 border-primary' : '',
  ].join(' ');
}

function useDraggableDraft(sourceList: Product[], reordering: boolean) {
  const [draft, setDraft] = useState<Product[]>([]);
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraft(sourceList);
    setDirty(false);
    setDragIndex(null);
    setDropIndex(null);
  }, [sourceList]);

  const reorder = useCallback((from: number, to: number) => {
    setDraft(prev => reorderListItems(prev, from, to));
    setDirty(true);
  }, []);

  const reset = useCallback(() => {
    setDraft(sourceList);
    setDirty(false);
    setDragIndex(null);
    setDropIndex(null);
  }, [sourceList]);

  const clearDrag = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  const getRowProps = useCallback((index: number) => ({
    draggable: !reordering,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndex ?? Number(e.dataTransfer.getData('text/plain'));
      reorder(from, index);
      clearDrag();
    },
    onDragEnd: clearDrag,
    onDragLeave: () => setDropIndex(prev => (prev === index ? null : prev)),
    className: dragRowClass(dragIndex, dropIndex, index),
  }), [reordering, dragIndex, reorder, clearDrag, dropIndex]);

  return { draft, dirty, setDirty, reset, getRowProps, dragHandle: '⠿' as const };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'> & { id?: number }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [addFeaturedId, setAddFeaturedId] = useState<number | ''>('');
  const [reordering, setReordering] = useState(false);
  const [orderCategory, setOrderCategory] = useState<number | 'all'>('all');

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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Math.round(form.price * 100) }),
      });
      if (res.ok) { setModal(null); load(); }
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  };

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (p: Product) => { setForm({ ...p, price: p.price / 100 }); setModal('edit'); };
  const fmtPrice = (c: number) => `$${(c / 100).toFixed(2)}`;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nameEs.toLowerCase().includes(search.toLowerCase())
  );

  const allProductsList = useMemo(
    () => [...products].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [products]
  );

  const signatureMeals = useMemo(
    () => products.filter(p => p.featured).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [products]
  );

  const orderList = useMemo(() => {
    const list = orderCategory === 'all'
      ? [...products]
      : products.filter(p => p.categoryId === orderCategory);
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [products, orderCategory]);

  const productsDrag = useDraggableDraft(allProductsList, reordering);
  const signatureDrag = useDraggableDraft(signatureMeals, reordering);
  const displayDrag = useDraggableDraft(orderList, reordering);

  const productsVisible = search.trim()
    ? productsDrag.draft.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nameEs.toLowerCase().includes(search.toLowerCase())
      )
    : productsDrag.draft;

  const canReorderProducts = !search.trim();

  const persistSignatureOrder = async (reordered: Product[]) => {
    await saveReorder(renumberSortOrder(reordered));
  };

  const persistDisplayOrder = async (reordered: Product[]) => {
    if (orderCategory === 'all') {
      await saveReorder(renumberSortOrder(reordered));
      return;
    }
    const base = Math.min(...reordered.map(p => p.sortOrder ?? 0), 1);
    await saveReorder(reordered.map((p, i) => ({ id: p.id, sortOrder: base + i })));
  };

  const saveDraftOrder = async (
    draft: Product[],
    persist: (reordered: Product[]) => Promise<void>,
    setDirty: (v: boolean) => void,
  ) => {
    setReordering(true);
    try {
      await persist(draft);
      setDirty(false);
      await load();
    } finally { setReordering(false); }
  };

  const saveProductsOrder = () => saveDraftOrder(productsDrag.draft, async (list) => {
    await saveReorder(renumberSortOrder(list));
  }, productsDrag.setDirty);

  const saveSignatureOrder = () => saveDraftOrder(signatureDrag.draft, persistSignatureOrder, signatureDrag.setDirty);

  const saveDisplayOrder = () => saveDraftOrder(displayDrag.draft, persistDisplayOrder, displayDrag.setDirty);

  const nonFeatured = products.filter(p => !p.featured);

  const addSignatureMeal = async () => {
    if (!addFeaturedId) return;
    const maxOrder = signatureMeals.reduce((m, p) => Math.max(m, p.sortOrder ?? 0), 0);
    setReordering(true);
    try {
      await saveReorder([
        { id: Number(addFeaturedId), featured: true, sortOrder: maxOrder + 1 },
      ]);
      setAddFeaturedId('');
      await load();
    } finally { setReordering(false); }
  };

  const removeSignatureMeal = async (id: number) => {
    setReordering(true);
    try {
      await saveReorder([{ id, featured: false }]);
      await load();
    } finally { setReordering(false); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'products', label: 'All Products' },
    { id: 'signature', label: 'Signature Meals' },
    { id: 'order', label: 'Display Order' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          {tab === 'products' && (
            <>
              <a href="/admin/categories" className="btn btn-ghost btn-sm">Categories</a>
              <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Product</button>
            </>
          )}
        </div>
      </div>

      <div className="tabs tabs-boxed bg-base-100 mb-6 w-fit max-w-full flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : tab === 'products' ? (
        <>
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <input
              className="input input-bordered w-full max-w-sm"
              placeholder="Search products..."
              value={search}
              disabled={productsDrag.dirty}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-3 pb-1 ml-auto">
              {productsDrag.dirty && (
                <span className="text-sm text-warning">Unsaved changes</span>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!productsDrag.dirty || reordering}
                onClick={saveProductsOrder}
              >
                {reordering ? 'Saving...' : 'Save order'}
              </button>
              {productsDrag.dirty && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={reordering}
                  onClick={productsDrag.reset}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-base-content/50 mb-4">
            {canReorderProducts
              ? 'Drag rows to reorder, then click Save order.'
              : 'Clear search to reorder products.'}
          </p>
          <div className="card bg-base-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>{canReorderProducts && <th className="w-10"></th>}<th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Featured</th><th>Available</th><th>Actions</th></tr></thead>
                <tbody>
                  {productsVisible.length === 0 && (
                    <tr><td colSpan={canReorderProducts ? 8 : 7} className="text-center text-base-content/50 py-8">No products found.</td></tr>
                  )}
                  {productsVisible.map((p) => {
                    const draftIndex = productsDrag.draft.findIndex(x => x.id === p.id);
                    const rowProps = canReorderProducts ? productsDrag.getRowProps(draftIndex) : {};
                    return (
                    <tr key={p.id} className={canReorderProducts ? rowProps.className : 'hover'} {...(canReorderProducts ? {
                      draggable: rowProps.draggable,
                      onDragStart: rowProps.onDragStart,
                      onDragOver: rowProps.onDragOver,
                      onDrop: rowProps.onDrop,
                      onDragEnd: rowProps.onDragEnd,
                      onDragLeave: rowProps.onDragLeave,
                    } : {})}>
                      {canReorderProducts && (
                        <td className="text-base-content/40 w-10">
                          <span aria-hidden="true">{productsDrag.dragHandle}</span>
                        </td>
                      )}
                      <td>
                        {p.imageUrl ? (
                          <div className="avatar"><div className="w-12 h-12 rounded-lg"><img src={p.imageUrl} alt={p.name} className="object-cover" /></div></div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center text-xl">🍽️</div>
                        )}
                      </td>
                      <td>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-base-content/50">{p.nameEs}</div>
                      </td>
                      <td className="text-sm">{categories.find(c => c.id === p.categoryId)?.name || '—'}</td>
                      <td className="font-bold">{fmtPrice(p.price)}</td>
                      <td>
                        <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={!!p.featured}
                          onChange={async () => {
                            await fetch(`/api/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !p.featured }) });
                            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, featured: !x.featured } : x));
                          }}
                        />
                      </td>
                      <td>
                        <input type="checkbox" className="toggle toggle-success toggle-sm" checked={p.available}
                          onChange={async () => {
                            await fetch(`/api/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !p.available }) });
                            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, available: !x.available } : x));
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : tab === 'signature' ? (
        <div className="space-y-6">
          <p className="text-sm text-base-content/60 max-w-2xl">
            These products appear in the homepage <strong>Our Signature Meals</strong> section (up to 6). Drag to change display order, then save.
          </p>

          <div className="flex flex-wrap gap-2 items-end">
            <div className="form-control min-w-[240px]">
              <label className="label"><span className="label-text">Add a product</span></label>
              <select className="select select-bordered select-sm" value={addFeaturedId} disabled={signatureDrag.dirty} onChange={e => setAddFeaturedId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Choose product…</option>
                {nonFeatured.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" disabled={!addFeaturedId || reordering || signatureDrag.dirty} onClick={addSignatureMeal}>Add to Signature Meals</button>
            <div className="flex items-center gap-3 pb-1 ml-auto">
              {signatureDrag.dirty && (
                <span className="text-sm text-warning">Unsaved changes</span>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!signatureDrag.dirty || reordering}
                onClick={saveSignatureOrder}
              >
                {reordering ? 'Saving...' : 'Save order'}
              </button>
              {signatureDrag.dirty && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={reordering}
                  onClick={signatureDrag.reset}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-base-content/50">Drag rows to reorder, then click Save order.</p>

          <div className="card bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th className="w-10"></th><th>#</th><th>Image</th><th>Name</th><th>Price</th><th></th></tr></thead>
                <tbody>
                  {signatureDrag.draft.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-base-content/50 py-8">No signature meals yet. Add products above.</td></tr>
                  )}
                  {signatureDrag.draft.map((p, i) => {
                    const rowProps = signatureDrag.getRowProps(i);
                    return (
                    <tr key={p.id} {...rowProps}>
                      <td className="text-base-content/40 w-10">
                        <span aria-hidden="true">{signatureDrag.dragHandle}</span>
                      </td>
                      <td className="text-base-content/50">{i + 1}{i < 6 ? ' · shown on homepage' : ''}</td>
                      <td>
                        {p.imageUrl ? (
                          <div className="avatar"><div className="w-10 h-10 rounded-lg"><img src={p.imageUrl} alt={p.name} className="object-cover" /></div></div>
                        ) : <span>—</span>}
                      </td>
                      <td>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-base-content/50">{p.nameEs}</div>
                      </td>
                      <td>{fmtPrice(p.price)}</td>
                      <td>
                        <button className="btn btn-ghost btn-xs text-error" disabled={reordering || signatureDrag.dirty} onClick={() => removeSignatureMeal(p.id)}>Remove</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-base-content/60 max-w-2xl">
            Control the order products appear on the <strong>Order Online</strong> page. Filter by category or use <strong>All</strong> for the full menu order.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <div className="form-control max-w-xs flex-1">
              <label className="label"><span className="label-text">Category</span></label>
              <select
                className="select select-bordered"
                value={orderCategory}
                disabled={displayDrag.dirty}
                onChange={e => setOrderCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pb-1">
              {displayDrag.dirty && (
                <span className="text-sm text-warning">Unsaved changes</span>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!displayDrag.dirty || reordering}
                onClick={saveDisplayOrder}
              >
                {reordering ? 'Saving...' : 'Save order'}
              </button>
              {displayDrag.dirty && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={reordering}
                  onClick={displayDrag.reset}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-base-content/50">Drag rows to reorder, then click Save order.</p>

          <div className="card bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th className="w-10"></th><th>#</th><th>Name</th><th>Category</th><th>Price</th></tr></thead>
                <tbody>
                  {displayDrag.draft.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-base-content/50 py-8">No products in this category.</td></tr>
                  )}
                  {displayDrag.draft.map((p, i) => {
                    const rowProps = displayDrag.getRowProps(i);
                    return (
                    <tr key={p.id} {...rowProps}>
                      <td className="text-base-content/40 w-10">
                        <span aria-hidden="true">{displayDrag.dragHandle}</span>
                      </td>
                      <td className="text-base-content/50">{i + 1}</td>
                      <td>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-base-content/50">{p.nameEs}</div>
                      </td>
                      <td className="text-sm">{categories.find(c => c.id === p.categoryId)?.name || '—'}</td>
                      <td>{fmtPrice(p.price)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-serif text-xl font-bold mb-4">{modal === 'create' ? 'Add Product' : 'Edit Product'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Name (EN)</span></label>
                <input className="input input-bordered" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Name (ES)</span></label>
                <input className="input input-bordered" value={form.nameEs} onChange={e => setForm({ ...form, nameEs: e.target.value })} />
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Description (EN)</span></label>
                <textarea className="textarea textarea-bordered" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Description (ES)</span></label>
                <textarea className="textarea textarea-bordered" rows={2} value={form.descriptionEs || ''} onChange={e => setForm({ ...form, descriptionEs: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Price ($)</span></label>
                <input type="number" step="0.01" min="0" className="input input-bordered" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category</span></label>
                <select className="select select-bordered" value={form.categoryId || ''} onChange={e => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-control col-span-2">
                <label className="label"><span className="label-text">Image URL</span></label>
                <input className="input input-bordered" value={form.imageUrl || ''} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="/menu-images/..." />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <span className="label-text">Available</span>
                  <input type="checkbox" className="toggle toggle-success" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <span className="label-text">Signature meal (featured)</span>
                  <input type="checkbox" className="toggle toggle-primary" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
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
