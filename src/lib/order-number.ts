export function createOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");

  const random = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `ORD-${date}-${random}`;
}

export function createPaymentReference() {
  return `PAY-${crypto.randomUUID().replaceAll("-", "")}`;
}
