import { useState, useEffect } from 'react';

interface CustomOrder {
  id: number; name: string; email: string; phone: string; dessertType?: string;
  size?: string; flavors?: string; occasion?: string; neededBy?: string;
  imageUrl?: string; notes?: string; status: string; createdAt: string;
}

const STATUSES = ['new','contacted','quoted','in-progress','ready','completed','declined'];

export default function AdminCustomOrders() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomOrder|null>(null);

  useEffect(() => {
    fetch('/api/inquiries/custom-orders').then(r => r.ok ? r.json() : []).then(setOrders).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/inquiries/custom-orders/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(o => o.id===id ? {...o, status} : o));
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-6">Custom Orders</h1>
      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : orders.length === 0 ? (
        <div className="card bg-base-100 p-12 text-center text-base-content/40">
          <div className="text-4xl mb-3">✨</div><p>No custom orders yet</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Customer</th><th>Type</th><th>Needed By</th><th>Status</th><th>Received</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="hover">
                    <td><div className="font-medium">{o.name}</div><div className="text-xs text-base-content/50">{o.email}</div></td>
                    <td className="text-sm">{o.dessertType||'—'}</td>
                    <td className="text-sm">{o.neededBy||'—'}</td>
                    <td>
                      <select className="select select-xs select-bordered" value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-base-content/50">{fmtDate(o.createdAt)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => setSelected(o)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between mb-4">
              <h3 className="font-serif text-xl font-bold">Custom Order #{selected.id}</h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-base-content/50">Name</span><p className="font-medium">{selected.name}</p></div>
                <div><span className="text-base-content/50">Phone</span><p className="font-medium">{selected.phone}</p></div>
                <div><span className="text-base-content/50">Type</span><p className="font-medium">{selected.dessertType||'—'}</p></div>
                <div><span className="text-base-content/50">Size</span><p className="font-medium">{selected.size||'—'}</p></div>
                <div><span className="text-base-content/50">Occasion</span><p className="font-medium">{selected.occasion||'—'}</p></div>
                <div><span className="text-base-content/50">Needed By</span><p className="font-medium">{selected.neededBy||'—'}</p></div>
              </div>
              {selected.flavors && <div><span className="text-base-content/50">Flavors</span><p className="mt-1 bg-base-200 rounded-lg p-3">{selected.flavors}</p></div>}
              {selected.notes && <div><span className="text-base-content/50">Notes</span><p className="mt-1 bg-base-200 rounded-lg p-3">{selected.notes}</p></div>}
              {selected.imageUrl && <div><span className="text-base-content/50">Inspiration Image</span><a href={selected.imageUrl} target="_blank" className="text-primary text-xs underline block mt-1">{selected.imageUrl}</a></div>}
              <div>
                <span className="text-base-content/50">Update Status:</span>
                <div className="flex gap-2 flex-wrap mt-2">
                  {STATUSES.map(s => (
                    <button key={s} className={`btn btn-xs capitalize ${selected.status===s ? 'btn-primary' : 'btn-outline'}`} onClick={() => updateStatus(selected.id, s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-action"><a href={`mailto:${selected.email}`} className="btn btn-primary btn-sm">✉️ Email Client</a></div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)}></div>
        </div>
      )}
    </div>
  );
}
