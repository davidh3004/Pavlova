import { useState, useEffect } from 'react';

function EmailStatus() {
  const [status, setStatus] = useState<{ configured: boolean; smsConfigured: boolean; notifyEmail: string; notifySource: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/email-status')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return <span className="text-sm text-base-content/40">Checking…</span>;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className={`badge ${status.configured ? 'badge-success' : 'badge-warning'}`}>
        {status.configured ? 'Resend configured' : 'Resend not configured'}
      </span>
      <span className={`badge ${status.smsConfigured ? 'badge-success' : 'badge-ghost'}`}>
        {status.smsConfigured ? 'SMS configured' : 'SMS not configured'}
      </span>
      <span className="text-base-content/70">
        Alerts go to <strong>{status.notifyEmail}</strong> ({status.notifySource})
      </span>
    </div>
  );
}

type DayKey = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
interface DayHours { closed: boolean; open: string; close: string; }
type BusinessHours = Record<DayKey, DayHours>;

const DAY_ORDER: DayKey[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<DayKey, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

const DEFAULT_HOURS: BusinessHours = DAY_ORDER.reduce((acc, day) => {
  acc[day] = day === 'saturday' || day === 'sunday'
    ? { closed: true, open: '09:00', close: '17:00' }
    : { closed: false, open: '07:30', close: '17:30' };
  return acc;
}, {} as BusinessHours);

interface Settings {
  businessName?: string; phone?: string; email?: string; address?: string;
  businessHours?: BusinessHours;
  instagramUrl?: string; facebookUrl?: string; whatsappNumber?: string;
  bakesyUrl?: string; googleMapsUrl?: string;
  metaTitle?: string; metaDescription?: string;
  announcementBanner?: string; bannerEnabled?: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminForm, setAdminForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : {}).then((s: Settings) => {
      setSettings({ ...s, businessHours: { ...DEFAULT_HOURS, ...s.businessHours } });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    const res = await fetch('/api/admin/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const changePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (adminForm.newPassword !== adminForm.confirm) { setPwError('Passwords do not match'); return; }
    if (adminForm.newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    const res = await fetch('/api/admin/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currentPassword: adminForm.currentPassword, newPassword: adminForm.newPassword }) });
    if (res.ok) { setPwSuccess(true); setAdminForm({ currentPassword:'', newPassword:'', confirm:'' }); }
    else { const d = await res.json().catch(() => ({})); setPwError(d.message || 'Failed to change password'); }
  };

  const f = (k: keyof Settings, v: any) => setSettings(prev => ({...prev, [k]: v}));

  const updateDay = (day: DayKey, patch: Partial<DayHours>) => setSettings(prev => ({
    ...prev,
    businessHours: {
      ...DEFAULT_HOURS,
      ...prev.businessHours,
      [day]: { ...DEFAULT_HOURS[day], ...prev.businessHours?.[day], ...patch },
    },
  }));

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">Settings</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Settings'}
        </button>
      </div>

      {/* Email notifications */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="font-serif text-xl font-bold mb-2">Email Notifications</h2>
          <p className="text-sm text-base-content/60 mb-4">
            Order and form alerts are sent via Resend when <code className="text-xs">RESEND_API_KEY</code> and{' '}
            <code className="text-xs">RESEND_FROM_EMAIL</code> are set in your hosting environment (Vercel).
            The inbox above is used unless you set a separate <code className="text-xs">NOTIFY_EMAIL</code> env var.
          </p>
          <EmailStatus />
        </div>
      </div>

      {/* Business Info */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="font-serif text-xl font-bold mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control"><label className="label"><span className="label-text">Business Name</span></label><input className="input input-bordered" value={settings.businessName||''} onChange={e => f('businessName',e.target.value)} /></div>
            <div className="form-control"><label className="label"><span className="label-text">Phone</span></label><input className="input input-bordered" value={settings.phone||''} onChange={e => f('phone',e.target.value)} /></div>
            <div className="form-control"><label className="label"><span className="label-text">Email</span></label><input type="email" className="input input-bordered" value={settings.email||''} onChange={e => f('email',e.target.value)} /></div>
            <div className="form-control col-span-full"><label className="label"><span className="label-text">Address</span></label><input className="input input-bordered" value={settings.address||''} onChange={e => f('address',e.target.value)} /></div>
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="font-serif text-xl font-bold mb-1">Business Hours</h2>
          <p className="text-sm text-base-content/60 mb-4">Set which days you're open and your hours for each — this is what shows in the site footer. Uncheck a day to mark it closed.</p>
          <div className="space-y-2">
            {DAY_ORDER.map(day => {
              const hours = settings.businessHours?.[day] ?? DEFAULT_HOURS[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 py-2 border-b border-base-200 last:border-0">
                  <span className="w-28 font-medium text-sm">{DAY_LABELS[day]}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={!hours.closed} onChange={e => updateDay(day, { closed: !e.target.checked })} />
                    <span className="text-sm text-base-content/70">Open</span>
                  </label>
                  {hours.closed ? (
                    <span className="text-sm text-base-content/40 italic">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="time" className="input input-bordered input-sm" value={hours.open} onChange={e => updateDay(day, { open: e.target.value })} />
                      <span className="text-base-content/50 text-sm">to</span>
                      <input type="time" className="input input-bordered input-sm" value={hours.close} onChange={e => updateDay(day, { close: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Social & Links */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="font-serif text-xl font-bold mb-4">Social Media & Links</h2>
          <div className="space-y-3">
            <div className="form-control"><label className="label"><span className="label-text">Instagram URL</span></label><input className="input input-bordered" value={settings.instagramUrl||''} onChange={e => f('instagramUrl',e.target.value)} placeholder="https://www.instagram.com/pavlovalovetampa/" /></div>
            <div className="form-control"><label className="label"><span className="label-text">WhatsApp Number</span></label><input className="input input-bordered" value={settings.whatsappNumber||''} onChange={e => f('whatsappNumber',e.target.value)} placeholder="+14074197137" /></div>
            <div className="form-control"><label className="label"><span className="label-text">Bakesy URL</span></label><input className="input input-bordered" value={settings.bakesyUrl||''} onChange={e => f('bakesyUrl',e.target.value)} placeholder="https://bakesy.shop" /></div>
            <div className="form-control"><label className="label"><span className="label-text">Google Maps URL</span></label><input className="input input-bordered" value={settings.googleMapsUrl||''} onChange={e => f('googleMapsUrl',e.target.value)} /></div>
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">Announcement Banner</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm">Enabled</span>
              <input type="checkbox" className="toggle toggle-primary" checked={settings.bannerEnabled||false} onChange={e => f('bannerEnabled',e.target.checked)} />
            </label>
          </div>
          <div className="form-control"><label className="label"><span className="label-text">Banner Text</span></label><input className="input input-bordered" value={settings.announcementBanner||''} onChange={e => f('announcementBanner',e.target.value)} placeholder="🎉 Special offer this weekend!" /></div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="font-serif text-xl font-bold mb-4">Change Admin Password</h2>
          {pwError && <div className="alert alert-error mb-3 text-sm"><span>{pwError}</span></div>}
          {pwSuccess && <div className="alert alert-success mb-3 text-sm"><span>Password changed successfully!</span></div>}
          <div className="space-y-3 max-w-md">
            <div className="form-control"><label className="label"><span className="label-text">Current Password</span></label><input type="password" className="input input-bordered" value={adminForm.currentPassword} onChange={e => setAdminForm({...adminForm, currentPassword:e.target.value})} /></div>
            <div className="form-control"><label className="label"><span className="label-text">New Password</span></label><input type="password" className="input input-bordered" value={adminForm.newPassword} onChange={e => setAdminForm({...adminForm, newPassword:e.target.value})} /></div>
            <div className="form-control"><label className="label"><span className="label-text">Confirm New Password</span></label><input type="password" className="input input-bordered" value={adminForm.confirm} onChange={e => setAdminForm({...adminForm, confirm:e.target.value})} /></div>
            <button className="btn btn-outline btn-sm" onClick={changePassword}>Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
