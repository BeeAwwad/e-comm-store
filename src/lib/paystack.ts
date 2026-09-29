type InitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerification = {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string | null;
    paid_at: string | null;
  };
};

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined");
  }

  return secretKey;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  orderId: string;
}) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountKobo),
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: JSON.stringify({
          orderId: input.orderId,
        }),
      }),
    },
  );

  const result = (await response.json()) as InitializeResponse;

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Could not initialize payment");
  }

  return result.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
      },
    },
  );

  const result = (await response.json()) as PaystackVerification;

  if (!response.ok || !result.status) {
    throw new Error(result.message || "Could not verify payment");
  }

  return result.data;
}
