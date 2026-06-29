/** Order serialization shared across order routes (mirrors old API shape). */
export function mapOrder(o: any) {
  return {
    ...o,
    subtotal: String(o.subtotal),
    total: String(o.total),
    createdAt: o.createdAt,
  };
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `PLT-${ts}`;
}
