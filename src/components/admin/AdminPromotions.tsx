import { useState, useEffect } from 'react';

interface Promo {
  id: number;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number | string;
  minimumOrder?: number | string | null;
  usageLimit?: number | null;
  usageCount: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

const EMPTY = {
  code: '',
  name: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  minimumOrder: '' as number | string,
  usageLimit: '' as number | string,
  active: true,
  expiresAt: '',
};

export default function AdminPromotions() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: number }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    const res = await fetch('/api/promotions');
    if (res.ok) setPromos(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const url = form.id ? `/api/promotions/${form.id}` : '/api/promotions';
    const method = form.id ? 'PUT' : 'POST';
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minimumOrder: form.minimumOrder !== '' ? Number(form.minimumOrder) : null,
      usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : null,
      active: form.active,
      expiresAt: form.expiresAt || null,
    };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setModal(null); load(); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    setDeleteId(null); load();
  };

  const toggle = async (id: number, active: boolean) => {
    await fetch(`/api/promotions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active } : p));
  };

  const fmtValue = (p: Promo) =>
    p.discountType === 'percentage' ? `${p.discountValue}%` : `$${Number(p.discountValue).toFixed(2)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Promotions</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>+ New Promo Code</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : promos.length === 0 ? (
        <div className="card bg-base-100 p-12 text-center text-base-content/40"><p>No promo codes yet</p></div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id} className="hover">
                    <td><span className="font-mono font-bold badge badge-outline">{p.code}</span></td>
                    <td className="font-bold text-success">{fmtValue(p)}</td>
                    <td className="text-sm">{p.minimumOrder ? `$${Number(p.minimumOrder).toFixed(2)}` : '—'}</td>
                    <td className="text-sm">{p.usageCount ?? 0}{p.usageLimit ? `/${p.usageLimit}` : ''}</td>
                    <td className="text-sm">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td><input type="checkbox" className="toggle toggle-success toggle-sm" checked={p.active} onChange={e => toggle(p.id, e.target.checked)} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => { setForm({ id: p.id, code: p.code, name: p.name || '', discountType: p.discountType, discountValue: Number(p.discountValue), minimumOrder: p.minimumOrder != null ? Number(p.minimumOrder) : '', usageLimit: p.usageLimit != null ? p.usageLimit : '', active: p.active, expiresAt: p.expiresAt?.split('T')[0] || '' }); setModal('edit'); }}>Edit</button>
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
      {modal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-serif text-xl font-bold mb-4">{modal === 'create' ? 'New Promo Code' : 'Edit Promo Code'}</h3>
            <div className="space-y-3">
              <div className="form-control"><label className="label"><span className="label-text">Code</span></label><input className="input input-bordered font-mono uppercase" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE10" /></div>
              <div className="form-control"><label className="label"><span className="label-text">Name (optional)</span></label><input className="input input-bordered" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Welcome Offer" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control"><label className="label"><span className="label-text">Type</span></label>
                  <select className="select select-bordered" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="form-control"><label className="label"><span className="label-text">Value ({form.discountType === 'percentage' ? '%' : '$'})</span></label><input type="number" step={form.discountType === 'percentage' ? 1 : 0.01} min="0" className="input input-bordered" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control"><label className="label"><span className="label-text">Min Order ($, optional)</span></label><input type="number" step="0.01" min="0" className="input input-bordered" value={form.minimumOrder} onChange={e => setForm({ ...form, minimumOrder: e.target.value })} /></div>
                <div className="form-control"><label className="label"><span className="label-text">Max Uses (optional)</span></label><input type="number" min="1" className="input input-bordered" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} /></div>
              </div>
              <div className="form-control"><label className="label"><span className="label-text">Expires (optional)</span></label><input type="date" className="input input-bordered" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="toggle toggle-success" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /><span className="text-sm">Active</span></label>
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
        <div className="modal modal-open"><div className="modal-box max-w-sm"><h3 className="font-bold text-lg">Delete Promo Code?</h3><div className="modal-action"><button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-error" onClick={() => remove(deleteId)}>Delete</button></div></div><div className="modal-backdrop" onClick={() => setDeleteId(null)}></div></div>
      )}
    </div>
  );
}
