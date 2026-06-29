import { useState, useEffect } from 'react';

interface Inquiry {
  id: number; name: string; email: string; phone: string; eventDate?: string;
  eventType?: string; guestCount?: string; details?: string; status: string; createdAt: string;
}

const STATUSES = ['new','contacted','quoted','confirmed','declined'];

export default function AdminCatering() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry|null>(null);

  useEffect(() => {
    fetch('/api/inquiries/catering').then(r => r.ok ? r.json() : []).then(setInquiries).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/inquiries/catering/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    setInquiries(prev => prev.map(i => i.id===id ? {...i, status} : i));
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-6">Catering Inquiries</h1>
      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : inquiries.length === 0 ? (
        <div className="card bg-base-100 p-12 text-center text-base-content/40">
          <div className="text-4xl mb-3">🎉</div><p>No catering inquiries yet</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Event</th><th>Date</th><th>Guests</th><th>Status</th><th>Received</th><th></th></tr></thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="hover">
                    <td><div className="font-medium">{i.name}</div><div className="text-xs text-base-content/50">{i.email}</div></td>
                    <td className="text-sm">{i.eventType || '—'}</td>
                    <td className="text-sm">{i.eventDate ? fmtDate(i.eventDate) : '—'}</td>
                    <td className="text-sm">{i.guestCount || '—'}</td>
                    <td>
                      <select className="select select-xs select-bordered" value={i.status} onChange={e => updateStatus(i.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-base-content/50">{fmtDate(i.createdAt)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => setSelected(i)}>View</button></td>
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
              <h3 className="font-serif text-xl font-bold">Catering Inquiry #{selected.id}</h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-base-content/50">Name</span><p className="font-medium">{selected.name}</p></div>
                <div><span className="text-base-content/50">Email</span><p className="font-medium">{selected.email}</p></div>
                <div><span className="text-base-content/50">Phone</span><p className="font-medium">{selected.phone}</p></div>
                <div><span className="text-base-content/50">Event Type</span><p className="font-medium">{selected.eventType||'—'}</p></div>
                <div><span className="text-base-content/50">Event Date</span><p className="font-medium">{selected.eventDate||'—'}</p></div>
                <div><span className="text-base-content/50">Guests</span><p className="font-medium">{selected.guestCount||'—'}</p></div>
              </div>
              {selected.details && <div><span className="text-base-content/50">Details</span><p className="mt-1 bg-base-200 rounded-lg p-3">{selected.details}</p></div>}
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
