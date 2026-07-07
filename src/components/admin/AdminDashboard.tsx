import { useState, useEffect } from 'react';

interface Stats {
  totalOrders?: number;
  pendingOrders?: number;
  totalRevenue?: number;
  totalProducts?: number;
  totalReviews?: number;
  pendingCatering?: number;
}

interface RecentOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  ready: 'badge-success',
  completed: 'badge-ghost',
  cancelled: 'badge-error',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({});
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/orders?limit=10'),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  const statCards = [
    { paths: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'], label: 'Total Orders', value: stats.totalOrders ?? 0, href: '/admin/orders' },
    { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'], label: 'Pending', value: stats.pendingOrders ?? 0, href: '/admin/orders', accent: true },
    { paths: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'], label: 'Revenue', value: fmtPrice(stats.totalRevenue ?? 0), href: '/admin/orders' },
    { paths: ['M2 21h20', 'M4 21v-8h16v8', 'M5 13V9a7 7 0 0 1 14 0v4', 'M12 2v3'], label: 'Products', value: stats.totalProducts ?? 0, href: '/admin/products' },
    { paths: ['m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 17.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'], label: 'Reviews', value: stats.totalReviews ?? 0, href: '/admin/reviews' },
    { paths: ['M4 20h16M6 20V10a6 6 0 0 1 12 0v10M12 4v2'], label: 'Catering Inquiries', value: stats.pendingCatering ?? 0, href: '/admin/catering' },
  ];

  const quickLinks = [
    { href: '/admin/products', paths: ['M2 21h20', 'M4 21v-8h16v8', 'M5 13V9a7 7 0 0 1 14 0v4', 'M12 2v3'], label: 'Manage Products' },
    { href: '/admin/categories', paths: ['M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v7H4zM13 15h7v7h-7z'], label: 'Categories' },
    { href: '/admin/menu', paths: ['M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'], label: 'Daily Menu' },
    { href: '/admin/reviews', paths: ['m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 17.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'], label: 'Reviews' },
    { href: '/admin/settings', paths: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'], label: 'Settings' },
  ];

  const Icon = ({ paths, size = 20 }: { paths: string[]; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-[0.65rem] tracking-[0.28em] uppercase text-[var(--rose)] font-semibold mb-1.5">Pavlova Love</p>
        <h1 className="font-serif text-4xl font-semibold text-base-content">Dashboard</h1>
        <p className="text-base-content/55 text-sm mt-1.5">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {statCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="group rounded-[var(--radius-box)] bg-base-100 border border-[var(--hairline)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all p-5 text-center"
          >
            <div className={`inline-grid place-items-center w-11 h-11 rounded-full mb-3 ${card.accent ? 'bg-[var(--cta)]/10 text-[var(--cta)]' : 'bg-[var(--blush-soft)] text-[var(--rose)]'}`}>
              <Icon paths={card.paths} />
            </div>
            <div className={`font-serif text-2xl font-semibold ${card.accent ? 'text-[var(--cta)]' : 'text-base-content'}`}>{card.value}</div>
            <div className="text-[0.7rem] tracking-wide text-base-content/50 mt-0.5">{card.label}</div>
          </a>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-[var(--radius-box)] bg-base-100 border border-[var(--hairline)] shadow-[var(--shadow-soft)]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-semibold text-base-content">Recent Orders</h2>
            <a href="/admin/orders" className="text-[0.7rem] font-bold tracking-[0.16em] uppercase text-[var(--cta)] hover:text-[var(--cta-hover)] transition-colors">View all →</a>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-base-content/40">
              <div className="inline-grid place-items-center w-12 h-12 rounded-full bg-[var(--blush-soft)] text-[var(--rose)] mb-3">
                <Icon paths={['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0']} size={22} />
              </div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-[0.65rem] tracking-[0.14em] uppercase text-base-content/45">
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover">
                      <td className="font-mono font-bold text-[var(--cta)]">#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td className="font-semibold">{fmtPrice(order.totalAmount)}</td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_COLORS[order.status] || 'badge-ghost'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-base-content/50 text-xs">{fmtDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {quickLinks.map((link) => (
          <a key={link.href} href={link.href} className="group flex items-center gap-3 rounded-[var(--radius-box)] bg-base-100 border border-[var(--hairline)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all p-4">
            <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-[var(--blush-soft)] text-[var(--rose)] shrink-0">
              <Icon paths={link.paths} size={18} />
            </span>
            <p className="text-sm font-medium text-base-content group-hover:text-[var(--cta)] transition-colors">{link.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
