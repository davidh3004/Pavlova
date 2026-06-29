import { useState, useEffect } from 'react';

interface Review {
  id: number; authorName: string; content: string; rating: number;
  platform?: string; approved: boolean; featured: boolean; createdAt: string;
}

const EMPTY = { authorName:'', content:'', rating:5, platform:'Google', approved:true, featured:false };

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [form, setForm] = useState<typeof EMPTY & {id?:number}>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => {
    const res = await fetch('/api/reviews');
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const url = form.id ? `/api/reviews/${form.id}` : '/api/reviews';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { setModal(null); load(); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    await fetch(`/api/reviews/${id}`, { method:'DELETE' });
    setDeleteId(null); load();
  };

  const toggle = async (id: number, field: 'approved'|'featured', val: boolean) => {
    await fetch(`/api/reviews/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ [field]: val }) });
    setReviews(prev => prev.map(r => r.id===id ? {...r, [field]: val} : r));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Reviews</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>+ Add Review</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Author</th><th>Rating</th><th>Review</th><th>Platform</th><th>Approved</th><th>Featured</th><th>Actions</th></tr></thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} className="hover">
                    <td className="font-medium">{r.authorName}</td>
                    <td className="text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</td>
                    <td className="max-w-xs"><p className="text-sm line-clamp-2 text-base-content/70">{r.content}</p></td>
                    <td className="text-sm">{r.platform||'—'}</td>
                    <td><input type="checkbox" className="toggle toggle-success toggle-sm" checked={r.approved} onChange={e => toggle(r.id,'approved',e.target.checked)} /></td>
                    <td><input type="checkbox" className="toggle toggle-primary toggle-sm" checked={r.featured} onChange={e => toggle(r.id,'featured',e.target.checked)} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => { setForm({...r}); setModal('edit'); }}>Edit</button>
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(r.id)}>Delete</button>
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
            <h3 className="font-serif text-xl font-bold mb-4">{modal==='create' ? 'Add Review' : 'Edit Review'}</h3>
            <div className="space-y-3">
              <div className="form-control"><label className="label"><span className="label-text">Author Name</span></label><input className="input input-bordered" value={form.authorName} onChange={e => setForm({...form, authorName:e.target.value})} /></div>
              <div className="form-control"><label className="label"><span className="label-text">Rating</span></label>
                <select className="select select-bordered" value={form.rating} onChange={e => setForm({...form, rating:Number(e.target.value)})}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                </select>
              </div>
              <div className="form-control"><label className="label"><span className="label-text">Review Text</span></label><textarea className="textarea textarea-bordered" rows={4} value={form.content} onChange={e => setForm({...form, content:e.target.value})} /></div>
              <div className="form-control"><label className="label"><span className="label-text">Platform</span></label><input className="input input-bordered" value={form.platform||''} onChange={e => setForm({...form, platform:e.target.value})} placeholder="Google, Instagram, Yelp..." /></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="checkbox checkbox-success" checked={form.approved} onChange={e => setForm({...form, approved:e.target.checked})} /><span className="text-sm">Approved</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="checkbox checkbox-primary" checked={form.featured} onChange={e => setForm({...form, featured:e.target.checked})} /><span className="text-sm">Featured</span></label>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setModal(null)}></div>
        </div>
      )}
      {deleteId && (
        <div className="modal modal-open"><div className="modal-box max-w-sm"><h3 className="font-bold text-lg">Delete Review?</h3><div className="modal-action"><button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-error" onClick={() => remove(deleteId)}>Delete</button></div></div><div className="modal-backdrop" onClick={() => setDeleteId(null)}></div></div>
      )}
    </div>
  );
}
