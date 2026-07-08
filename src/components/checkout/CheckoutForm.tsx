import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, clearCart } from '@/stores/cart';
import type { Lang } from '@/stores/language';

interface Props {
  lang: Lang;
}

interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: string;
  configured: boolean;
}

declare const Square: any;

const SQUARE_SDK = {
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
} as const;

function loadSquareSdk(environment: string): Promise<void> {
  if (typeof Square !== 'undefined') return Promise.resolve();
  const src = environment === 'production' ? SQUARE_SDK.production : SQUARE_SDK.sandbox;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve) => {
      if (typeof Square !== 'undefined') resolve();
      else existing.addEventListener('load', () => resolve());
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Square SDK'));
    document.head.appendChild(script);
  });
}

const pickupTimes = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM'];

const lbl = {
  en: { title: 'Checkout', subtitle: 'Pickup at our Tampa location', address: '3909 W Broad St, Tampa, FL 33614', details: 'Pickup Details', name: 'Your Name', namePh: 'María García', phone: 'Phone Number', phonePh: '(813) 555-0100', email: 'Email (optional)', emailPh: 'you@email.com', time: 'Pickup Time', asap: 'As soon as possible (20–30 mins)', payment: 'Payment Method', card: 'Pay by Card', applepay: 'Apple Pay', googlepay: 'Google Pay', orPayWith: 'Or pay with', selected: 'Selected', paymentUnavailable: 'Online payment is temporarily unavailable. Please check back soon.', applePaySafariOnly: 'Apple Pay appears in Safari on iPhone, iPad, or Mac with a card in Wallet.', useWalletCta: 'Tap the button above to complete your order.', preferDelivery: 'Prefer Delivery?', deliverySub: 'Order through our trusted delivery partners.', summary: 'Order Summary', item: 'Item', items: 'Items', qty: 'Qty', subtotal: 'Subtotal', pickupFee: 'Pickup Fee', free: 'Free', total: 'Total', place: 'Place Order', processing: 'Processing...', agreePre: 'By placing your order, you agree to our', termsOfService: 'Terms of Service', and: 'and', privacyPolicy: 'Privacy Policy', confirmed: 'Payment Complete!', confirmedMsg: 'Your payment was verified successfully.', confirmedPreparing: "We're preparing your order now and will have it ready for pickup.", confirmedPickup: 'Pickup', orderNum: 'Order #', newOrder: 'Place Another Order', emptyCart: 'Your cart is empty', emptyLink: 'Go back to menu', backToOrder: 'Back to Order', cardDetails: 'Card Details' },
  es: { title: 'Pago', subtitle: 'Recogida en nuestra ubicación de Tampa', address: '3909 W Broad St, Tampa, FL 33614', details: 'Detalles de Recogida', name: 'Tu Nombre', namePh: 'María García', phone: 'Teléfono', phonePh: '(813) 555-0100', email: 'Correo (opcional)', emailPh: 'tu@correo.com', time: 'Hora de Recogida', asap: 'Lo antes posible (20–30 min)', payment: 'Método de Pago', card: 'Pagar con Tarjeta', applepay: 'Apple Pay', googlepay: 'Google Pay', orPayWith: 'O pagar con', selected: 'Seleccionado', paymentUnavailable: 'El pago en línea no está disponible en este momento. Vuelve a intentarlo más tarde.', applePaySafariOnly: 'Apple Pay aparece en Safari en iPhone, iPad o Mac con una tarjeta en Wallet.', useWalletCta: 'Toca el botón de arriba para completar tu pedido.', preferDelivery: '¿Prefieres Entrega?', deliverySub: 'Ordena a través de nuestros socios de entrega.', summary: 'Resumen del Pedido', item: 'Artículo', items: 'Artículos', qty: 'Cant.', subtotal: 'Subtotal', pickupFee: 'Tarifa de Recogida', free: 'Gratis', total: 'Total', place: 'Realizar Pedido', processing: 'Procesando...', agreePre: 'Al realizar tu pedido, aceptas nuestros', termsOfService: 'Términos de Servicio', and: 'y', privacyPolicy: 'Política de Privacidad', confirmed: '¡Pago Completado!', confirmedMsg: 'Tu pago fue verificado exitosamente.', confirmedPreparing: 'Estamos preparando tu pedido y lo tendremos listo para recoger.', confirmedPickup: 'Recogida', orderNum: 'Pedido #', newOrder: 'Realizar Otro Pedido', emptyCart: 'Tu carrito está vacío', emptyLink: 'Volver al menú', backToOrder: 'Volver al Pedido', cardDetails: 'Datos de la Tarjeta' },
};

export default function CheckoutForm({ lang }: Props) {
  const t = lbl[lang] || lbl.en;
  const items = useStore(cartItems);
  const total = useStore(cartTotal);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pickupTime, setPickupTime] = useState('asap');
  const [processing, setProcessing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number|null>(null);
  const [confirmedPickupTime, setConfirmedPickupTime] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [squareSdkReady, setSquareSdkReady] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [walletsProbed, setWalletsProbed] = useState(false);

  const cardRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const paymentRequestRef = useRef<any>(null);
  const walletPayRef = useRef<(method: 'applepay' | 'googlepay', instance: any) => void>(() => {});

  // Load Square config at runtime from the server (reads Vercel env vars on each request).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/square/payments/config')
      .then((r) => r.json())
      .then((cfg: SquareConfig) => {
        if (!cancelled) setSquareConfig(cfg);
      })
      .catch(() => {
        if (!cancelled) setSquareConfig({ applicationId: '', locationId: '', environment: 'sandbox', configured: false });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!squareConfig?.configured) return;
    let cancelled = false;
    loadSquareSdk(squareConfig.environment)
      .then(() => { if (!cancelled) setSquareSdkReady(true); })
      .catch((e) => console.error('Square SDK load failed', e));
    return () => { cancelled = true; };
  }, [squareConfig?.configured, squareConfig?.environment]);

  // Create the shared Square `payments` client once the SDK is loaded — Card,
  // Apple Pay and Google Pay all initialize from this same instance.
  useEffect(() => {
    if (!squareConfig?.configured || !squareSdkReady) return;
    const { applicationId, locationId } = squareConfig;
    try {
      paymentsRef.current = Square.payments(applicationId, locationId);
      setPaymentsReady(true);
    } catch (e) {
      console.error('Square payments init failed', e);
    }
    return () => {
      paymentsRef.current = null;
      setPaymentsReady(false);
    };
  }, [squareConfig?.configured, squareSdkReady, squareConfig?.applicationId, squareConfig?.locationId]);

  useEffect(() => {
    if (!paymentsReady) return;

    const payments = paymentsRef.current;
    let cancelled = false;
    let localCard: any = null;

    const initCard = async () => {
      try {
        // NOTE: Square's Web Payments SDK only accepts standard color formats
        // (hex / rgb / named). oklch() throws "Invalid style value", which would
        // reject card() and leave the field blank — keep this a hex value.
        const card = await payments.card({
          style: { '.input-container': { borderRadius: '8px' }, '.input-container.is-focus': { borderColor: '#c0445f' } },
        });
        // The effect was torn down while card() was resolving — discard this instance.
        if (cancelled) { card.destroy?.(); return; }
        // Remove any iframe orphaned by a previous (cancelled/double-invoked) init
        // so we never attach a second card into the same container.
        const container = document.getElementById('square-card-container');
        if (container) container.innerHTML = '';
        await card.attach('#square-card-container');
        if (cancelled) { card.destroy?.(); return; }
        localCard = card;
        cardRef.current = card;
      } catch (e) {
        console.error('Square card init failed', e);
      }
    };
    initCard();

    return () => {
      cancelled = true;
      try { (localCard ?? cardRef.current)?.destroy?.(); } catch {}
      cardRef.current = null;
    };
  }, [paymentsReady]);

  // Apple Pay / Google Pay: init once, then update the amount when the cart changes.
  useEffect(() => {
    if (!paymentsReady || total <= 0) return;
    const payments = paymentsRef.current;
    let cancelled = false;

    const initWallets = async () => {
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: (total / 100).toFixed(2), label: 'Pavlova Love Tampa' },
        });
        paymentRequestRef.current = paymentRequest;

        try {
          const applePay = await payments.applePay(paymentRequest);
          if (cancelled) { applePay.destroy?.().catch(() => {}); return; }
          applePayRef.current = applePay;
          setApplePayAvailable(true);
        } catch (e) {
          console.error('Apple Pay unavailable:', e);
          if (!cancelled) setApplePayAvailable(false);
        }

        try {
          const googlePay = await payments.googlePay(paymentRequest);
          if (cancelled) { googlePay.destroy?.().catch(() => {}); return; }
          googlePayRef.current = googlePay;
          setGooglePayAvailable(true);
        } catch (e) {
          console.error('Google Pay unavailable:', e);
          if (!cancelled) setGooglePayAvailable(false);
        }
      } catch (e) {
        console.error('Digital wallet init failed:', e);
      } finally {
        if (!cancelled) setWalletsProbed(true);
      }
    };

    initWallets();

    return () => {
      cancelled = true;
      applePayRef.current?.destroy?.().catch(() => {});
      googlePayRef.current?.destroy?.().catch(() => {});
      applePayRef.current = null;
      googlePayRef.current = null;
      paymentRequestRef.current = null;
      setApplePayAvailable(false);
      setGooglePayAvailable(false);
      setWalletsProbed(false);
    };
  }, [paymentsReady, total > 0]);

  useEffect(() => {
    const paymentRequest = paymentRequestRef.current;
    if (!paymentRequest || total <= 0) return;
    try {
      paymentRequest.update({
        total: { amount: (total / 100).toFixed(2), label: 'Pavlova Love Tampa' },
      });
    } catch (e) {
      console.error('Payment request update failed:', e);
    }
  }, [total]);

  // Google Pay renders its own branded button — attach when available.
  useEffect(() => {
    if (!googlePayAvailable || !googlePayRef.current) return;
    const googlePay = googlePayRef.current;
    const container = document.getElementById('google-pay-button');
    if (!container) return;
    container.innerHTML = '';
    googlePay.attach('#google-pay-button').catch((e: any) => console.error('Google Pay attach failed', e));
    const onClick = (event: Event) => {
      event.preventDefault();
      walletPayRef.current('googlepay', googlePayRef.current);
    };
    container.addEventListener('click', onClick);

    return () => {
      container.removeEventListener('click', onClick);
      googlePay.detach?.('#google-pay-button')?.catch?.(() => {});
    };
  }, [googlePayAvailable]);

  const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const finalTotal = total;

  const validate = () => {
    const e: Record<string,string> = {};
    if (!name.trim()) e.name = lang === 'es' ? 'Requerido' : 'Required';
    if (!phone.trim()) e.phone = lang === 'es' ? 'Requerido' : 'Required';
    if (!pickupTime) e.time = lang === 'es' ? 'Selecciona una hora' : 'Select a time';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const completePaidOrder = async (orderId: number) => {
    setConfirmedPickupTime(pickupTime === 'asap' ? t.asap : pickupTime);
    setConfirmedOrderId(orderId);
    clearCart();
  };

  const chargeOrder = async (orderId: number, token: string) => {
    const payRes = await fetch('/api/square/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: token,
        orderId,
        amount: finalTotal / 100,
        customerName: name,
        customerEmail: email.trim() || undefined,
      }),
    });
    if (!payRes.ok) {
      const data = await payRes.json().catch(() => null);
      const detail = data?.errors?.[0]?.detail || data?.error;
      throw new Error(detail || (lang === 'es' ? 'Pago rechazado.' : 'Payment was declined.'));
    }
  };

  const createOrder = async (paymentMethod: string) => {
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        customerEmail: email.trim() || null,
        pickupTime: pickupTime === 'asap' ? t.asap : pickupTime,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions,
        })),
        totalAmount: finalTotal,
      }),
    });
    if (!orderRes.ok) throw new Error('Order failed');
    return orderRes.json();
  };

  // Apple Pay / Google Pay must call tokenize() immediately on click — before any API calls.
  const payWithWallet = async (method: 'applepay' | 'googlepay', paymentInstance: any) => {
    if (!paymentInstance || processing) return;
    if (!validate()) return;
    setProcessing(true);
    try {
      let tokenResult: any;
      try {
        tokenResult = await paymentInstance.tokenize();
      } catch {
        throw new Error(lang === 'es'
          ? 'No se pudo procesar el pago. Desactiva tu bloqueador de anuncios para este sitio e inténtalo de nuevo.'
          : 'Could not reach the payment processor. Disable your ad/privacy blocker for this site and try again.');
      }
      if (tokenResult.status === 'CANCEL') return;
      if (tokenResult.status !== 'OK') {
        const detail = tokenResult.errors?.[0]?.message;
        throw new Error(detail || (lang === 'es' ? 'No se pudo validar el pago.' : 'Payment could not be validated.'));
      }

      const order = await createOrder(method);
      await chargeOrder(order.id, tokenResult.token);
      await completePaidOrder(order.id);
    } catch (e: any) {
      setErrors({ submit: e.message || (lang === 'es' ? 'Error al procesar el pedido.' : 'Failed to process order.') });
    } finally {
      setProcessing(false);
    }
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setProcessing(true);
    try {
      const order = await createOrder('card');

      const paymentInstance = cardRef.current;
      if (paymentInstance) {
        let tokenResult: any;
        try {
          tokenResult = await paymentInstance.tokenize();
        } catch {
          throw new Error(lang === 'es'
            ? 'No se pudo procesar el pago. Desactiva tu bloqueador de anuncios para este sitio e inténtalo de nuevo.'
            : 'Could not reach the payment processor. Disable your ad/privacy blocker for this site and try again.');
        }
        if (tokenResult.status === 'CANCEL') return;
        if (tokenResult.status !== 'OK') {
          const detail = tokenResult.errors?.[0]?.message;
          throw new Error(detail || (lang === 'es' ? 'No se pudo validar el pago.' : 'Payment could not be validated.'));
        }

        await chargeOrder(order.id, tokenResult.token);
      }

      await completePaidOrder(order.id);
    } catch (e: any) {
      setErrors({ submit: e.message || (lang === 'es' ? 'Error al procesar el pedido.' : 'Failed to process order.') });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => { walletPayRef.current = payWithWallet; });

  if (items.length === 0 && !confirmedOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="grid place-items-center w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--blush-soft)] text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <p className="font-serif text-2xl mb-4">{t.emptyCart}</p>
          <a href="/order" className="btn btn-cta">{t.emptyLink}</a>
        </div>
      </div>
    );
  }

  if (confirmedOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-[var(--radius-box)] border border-[var(--hairline)] shadow-[var(--shadow-lift)] max-w-md w-full">
          <div className="text-center p-10">
            <div className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h2 className="font-serif text-3xl text-base-content mb-2">{t.confirmed}</h2>
            <p className="text-base-content/70 mb-2">{t.confirmedMsg}</p>
            <p className="text-base-content/60 mb-6">{t.confirmedPreparing}</p>
            <div className="space-y-2">
              <div className="pill text-sm py-2 px-5">{t.orderNum}{confirmedOrderId}</div>
              {confirmedPickupTime && (
                <div className="text-sm text-base-content/60">
                  <span className="font-semibold text-base-content/80">{t.confirmedPickup}:</span> {confirmedPickupTime}
                </div>
              )}
            </div>
            <div className="mt-8">
              <a href="/order" className="btn btn-cta w-full">{t.newOrder}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const inputCls = 'w-full bg-base-100 border border-[var(--hairline)] rounded-xl px-4 py-3 text-sm text-base-content placeholder:text-base-content/35 focus:border-[var(--cta)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)]/20 transition';
  const fieldLabel = 'block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2';

  return (
    <div className="min-h-screen bg-base-100 py-10 lg:py-14 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <a href="/order" className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/55 hover:text-[var(--cta)] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          {t.backToOrder}
        </a>
        <h1 className="font-serif text-5xl lg:text-6xl text-base-content mt-5 leading-none">{t.title}</h1>
        <p className="text-base-content/55 text-sm mt-3">{t.subtitle}: {t.address}</p>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 md:gap-12 lg:gap-16 items-start mt-10 lg:mt-12">
          {/* Left: Form */}
          <div>
            {/* 01 — Pickup Details */}
            <div className="flex items-center gap-3 mb-7">
              <span className="grid place-items-center min-w-[2.1rem] h-7 px-2 rounded-full bg-[var(--blush-soft)] text-[0.7rem] font-bold tracking-wider text-base-content/70">01</span>
              <h2 className="font-serif text-2xl text-base-content">{t.details}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={fieldLabel}>{t.name}</label>
                <input className={`${inputCls} ${errors.name ? 'border-[var(--rose)]' : ''}`} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} />
                {errors.name && <p className="text-xs text-[var(--rose)] mt-1.5">{errors.name}</p>}
              </div>
              <div>
                <label className={fieldLabel}>{t.phone}</label>
                <input className={`${inputCls} ${errors.phone ? 'border-[var(--rose)]' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePh} type="tel" />
                {errors.phone && <p className="text-xs text-[var(--rose)] mt-1.5">{errors.phone}</p>}
              </div>
            </div>

            <div className="mt-5">
              <label className={fieldLabel}>{t.email}</label>
              <input
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPh}
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="mt-5">
              <label className={fieldLabel}>{t.time}</label>
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-10 cursor-pointer`} value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
                  <option value="asap">{t.asap}</option>
                  {pickupTimes.map((tm) => <option key={tm} value={tm}>{tm}</option>)}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            <hr className="border-0 border-t border-[var(--hairline)] my-9" />

            {/* 02 — Payment Method */}
            <div className="flex items-center gap-3 mb-7">
              <span className="grid place-items-center min-w-[2.1rem] h-7 px-2 rounded-full bg-[var(--blush-soft)] text-[0.7rem] font-bold tracking-wider text-base-content/70">02</span>
              <h2 className="font-serif text-2xl text-base-content">{t.payment}</h2>
            </div>

            <div className="space-y-3">
              {squareConfig?.configured && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-[var(--cta)] bg-[var(--cta)]/[0.04]">
                  <span className="text-base leading-none">💳</span>
                  <span className="flex-1 font-semibold text-sm text-base-content">{t.card}</span>
                </div>
              )}
              {squareConfig && !squareConfig.configured && (
                <p className="text-xs text-base-content/45 italic">{t.paymentUnavailable}</p>
              )}
            </div>

            {squareConfig?.configured ? (
              <div className="mt-4">
                <p className="text-sm font-medium mb-3">{t.cardDetails}</p>
                <div id="square-card-container" className="min-h-[80px] rounded-xl border border-[var(--hairline)] p-3"></div>
              </div>
            ) : null}

            {(applePayAvailable || googlePayAvailable) && (
              <div className="mt-6 space-y-3">
                <p className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/45 text-center">{t.orPayWith}</p>
                {applePayAvailable && (
                  <button
                    type="button"
                    id="apple-pay-button"
                    aria-label="Apple Pay"
                    onClick={(e) => {
                      e.preventDefault();
                      walletPayRef.current('applepay', applePayRef.current);
                    }}
                    disabled={processing}
                    className="apple-pay-button"
                  />
                )}
                {googlePayAvailable && (
                  <div id="google-pay-button" className="min-h-[48px]"></div>
                )}
              </div>
            )}

            {walletsProbed && !applePayAvailable && !googlePayAvailable && squareConfig?.configured && (
              <p className="mt-4 text-xs text-base-content/45 italic">{t.applePaySafariOnly}</p>
            )}

            <hr className="border-0 border-t border-[var(--hairline)] my-9" />

            {/* Prefer Delivery */}
            <div className="rounded-2xl border border-dashed border-base-content/20 bg-base-200/40 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-serif text-lg text-base-content">{t.preferDelivery}</p>
                <p className="text-xs text-base-content/55 mt-0.5">{t.deliverySub}</p>
              </div>
              <div className="flex items-center gap-5 text-sm font-extrabold tracking-tight text-base-content/70">
                <span>Uber Eats</span>
                <span>DOORDASH</span>
                <span>GRUBHUB</span>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="md:sticky md:top-24">
            <div className="bg-base-100 rounded-[24px] border border-[var(--hairline)] shadow-[var(--shadow-lift)] p-7 lg:p-8">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="font-serif text-2xl text-base-content">{t.summary}</h2>
                <span className="shrink-0 rounded-full bg-base-200 px-3 py-1 text-[0.6rem] font-bold tracking-[0.16em] uppercase text-base-content/60">
                  {itemCount} {itemCount === 1 ? t.item : t.items}
                </span>
              </div>

              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.cartItemId} className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-serif text-base text-base-content leading-snug">{lang === 'es' ? item.nameEs : item.name}</p>
                      <p className="text-xs text-base-content/45 mt-0.5">{t.qty}: {item.quantity}</p>
                      {item.specialInstructions && <p className="text-xs text-base-content/40 italic mt-0.5">{item.specialInstructions}</p>}
                    </div>
                    <span className="text-sm font-semibold text-base-content flex-shrink-0">{fmtPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <hr className="border-0 border-t border-[var(--hairline)] my-6" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">{t.subtotal}</span>
                  <span className="text-base-content">{fmtPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">{t.pickupFee}</span>
                  <span className="text-emerald-600 font-bold text-[0.7rem] tracking-[0.12em] uppercase">{t.free}</span>
                </div>
              </div>

              <hr className="border-0 border-t border-[var(--hairline)] my-6" />

              <div className="flex justify-between items-baseline">
                <span className="font-serif text-2xl text-base-content">{t.total}</span>
                <span className="font-serif text-3xl text-[var(--cta)]">{fmtPrice(finalTotal)}</span>
              </div>

              {errors.submit && (
                <div className="mt-5 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/30 px-4 py-3 text-sm text-[var(--rose)]">
                  {errors.submit}
                </div>
              )}

              <button
                className="w-full mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cta)] text-white text-[0.72rem] font-bold tracking-[0.2em] uppercase py-4 hover:bg-[var(--cta-hover)] disabled:opacity-60 transition-colors"
                onClick={placeOrder}
                disabled={processing || !squareConfig?.configured}
              >
                {processing && <span className="loading loading-spinner loading-sm"></span>}
                {processing ? t.processing : t.place}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
