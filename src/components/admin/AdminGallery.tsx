import { useState, useEffect } from 'react';

interface GalleryItem { id: number; imageUrl: string; caption?: string; captionEs?: string; category?: string; sortOrder: number; }

const EMPTY = { imageUrl:'', caption:'', captionEs:'', category:'', sortOrder:0 };

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [form, setForm] = useState<typeof EMPTY & {id?:number}>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => {
    const res = await fetch('/api/gallery');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const url = form.id ? `/api/gallery/${form.id}` : '/api/gallery';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { setModal(null); load(); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    await fetch(`/api/gallery/${id}`, { method:'DELETE' });
    setDeleteId(null); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Gallery</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>+ Add Image</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="card bg-base-100 shadow-sm overflow-hidden group">
              <figure className="aspect-square">
                <img src={item.imageUrl} alt={item.caption||''} className="w-full h-full object-cover" loading="lazy" />
              </figure>
              <div className="card-body p-3">
                <p className="text-xs text-base-content/60 line-clamp-1">{item.caption||'—'}</p>
                {item.category && <span className="badge badge-ghost badge-xs">{item.category}</span>}
                <div className="flex gap-1 mt-1">
                  <button className="btn btn-ghost btn-xs" onClick={() => { setForm({...item}); setModal('edit'); }}>Edit</button>
                  <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-20 text-base-content/40">
              <div className="text-4xl mb-3">📷</div><p>No gallery items yet</p>
            </div>
          )}
        </div>
      )}
      {modal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-serif text-xl font-bold mb-4">{modal==='create' ? 'Add Image' : 'Edit Image'}</h3>
            <div className="space-y-3">
              <div className="form-control"><label className="label"><span className="label-text">Image URL</span></label><input className="input input-bordered" value={form.imageUrl} onChange={e => setForm({...form, imageUrl:e.target.value})} placeholder="/menu-images/..." /></div>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-40 object-cover rounded-xl" onError={e => (e.currentTarget.style.display='none')} />}
              <div className="form-control"><label className="label"><span className="label-text">Caption (EN)</span></label><input className="input input-bordered" value={form.caption||''} onChange={e => setForm({...form, caption:e.target.value})} /></div>
              <div className="form-control"><label className="label"><span className="label-text">Caption (ES)</span></label><input className="input input-bordered" value={form.captionEs||''} onChange={e => setForm({...form, captionEs:e.target.value})} /></div>
              <div className="form-control"><label className="label"><span className="label-text">Category (optional)</span></label><input className="input input-bordered" value={form.category||''} onChange={e => setForm({...form, category:e.target.value})} placeholder="pavlovas, arepas, events..." /></div>
              <div className="form-control"><label className="label"><span className="label-text">Sort Order</span></label><input type="number" className="input input-bordered" value={form.sortOrder} onChange={e => setForm({...form, sortOrder:Number(e.target.value)})} /></div>
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
        <div className="modal modal-open"><div className="modal-box max-w-sm"><h3 className="font-bold text-lg">Delete Image?</h3><div className="modal-action"><button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-error" onClick={() => remove(deleteId)}>Delete</button></div></div><div className="modal-backdrop" onClick={() => setDeleteId(null)}></div></div>
      )}
    </div>
  );
}
