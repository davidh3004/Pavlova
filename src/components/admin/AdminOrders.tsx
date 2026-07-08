import { useState, useEffect } from 'react';

interface OrderItem { id: number; name: string; quantity: number; price: number; }
interface Order {
  id: number; customerName: string; customerPhone: string; pickupTime: string;
  totalAmount: number; status: string; paymentMethod: string;
  squareOrderId?: string | null;
  promoCode?: string | null; discount?: number | string;
  createdAt: string; items?: OrderItem[];
}

const STATUSES = ['pending','confirmed','ready','completed','cancelled'];
const STATUS_COLORS: Record<string,string> = { pending:'badge-warning', confirmed:'badge-info', ready:'badge-success', completed:'badge-ghost', cancelled:'badge-error' };
const PAYMENT_LABELS: Record<string,string> = { card: 'Card', applepay: 'Apple Pay', googlepay: 'Google Pay' };
const formatPaymentMethod = (method: string) => PAYMENT_LABELS[method] ?? method;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order|null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o));
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null);
  };

  const fmtPrice = (c: number) => `$${(c/100).toFixed(2)}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Orders</h1>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="tabs tabs-boxed mb-6 w-fit">
        {['all',...STATUSES].map(s => (
          <button key={s} className={`tab tab-sm capitalize ${filter === s ? 'tab-active' : ''}`} onClick={() => setFilter(s)}>
            {s} {s !== 'all' && <span className="ml-1 badge badge-xs">{orders.filter(o=>o.status===s).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow-sm p-12 text-center text-base-content/40">
          <div className="text-4xl mb-3">🛒</div>
          <p>No {filter !== 'all' ? filter : ''} orders</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="hover cursor-pointer" onClick={() => setSelected(order)}>
                    <td className="font-mono font-bold text-primary">#{order.id}</td>
                    <td>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-base-content/50">{order.customerPhone}</div>
                    </td>
                    <td className="text-sm">{order.items?.length ?? '—'} items</td>
                    <td className="font-bold">{fmtPrice(order.totalAmount)}</td>
                    <td>
                      <select
                        className={`select select-xs ${STATUS_COLORS[order.status]}`}
                        value={order.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(order.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-base-content/50">{fmtDate(order.createdAt)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); setSelected(order); }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-bold">Order #{selected.id}</h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/50">Customer</span><p className="font-medium">{selected.customerName}</p></div>
                <div><span className="text-base-content/50">Phone</span><p className="font-medium">{selected.customerPhone}</p></div>
                <div><span className="text-base-content/50">Pickup Time</span><p className="font-medium">{selected.pickupTime}</p></div>
                <div><span className="text-base-content/50">Payment</span><p className="font-medium">{formatPaymentMethod(selected.paymentMethod)}</p></div>
                {selected.squareOrderId && (
                  <div className="col-span-2">
                    <span className="text-base-content/50">Square Order</span>
                    <p className="font-mono text-xs break-all">{selected.squareOrderId}</p>
                  </div>
                )}
              </div>
              {selected.items && selected.items.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Items:</p>
                  <ul className="space-y-1">
                    {selected.items.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{fmtPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-base-200">
                <span>Total</span>
                <span className="text-primary">{fmtPrice(selected.totalAmount)}</span>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm capitalize ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => updateStatus(selected.id, s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)}></div>
        </div>
      )}
    </div>
  );
}
