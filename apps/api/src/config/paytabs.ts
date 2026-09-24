import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env.js';
import { AppError, ErrorCodes } from '../shared/errors.js';

export type PaytabsCustomer = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  zip?: string;
  ip?: string;
};

export type PaytabsPaymentResult = {
  response_status?: string;
  response_code?: string;
  response_message?: string;
  transaction_time?: string;
};

export type PaytabsHostedResponse = {
  tran_ref?: string;
  redirect_url?: string;
  cart_id?: string;
  payment_result?: PaytabsPaymentResult;
  message?: string;
  code?: number | string;
};

function requireMeps() {
  if (!env.isMepsConfigured) {
    throw new AppError(
      503,
      ErrorCodes.VALIDATION_ERROR,
      'الدفع بالبطاقة غير مُعدّ. أضف PAYTABS_PROFILE_ID و PAYTABS_SERVER_KEY في apps/api/.env',
    );
  }
}

async function paytabsFetch(path: string, body: Record<string, unknown>): Promise<PaytabsHostedResponse> {
  requireMeps();
  const res = await fetch(`${env.paytabsBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      authorization: env.paytabsServerKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as PaytabsHostedResponse;
  if (!res.ok) {
    const msg = data.message || data.payment_result?.response_message || `PayTabs HTTP ${res.status}`;
    throw new AppError(502, ErrorCodes.VALIDATION_ERROR, msg);
  }
  return data;
}

export function getPaytabsCallbackUrl(): string | undefined {
  if (env.PAYTABS_CALLBACK_URL) return env.PAYTABS_CALLBACK_URL;
  // PayTabs rejects http://localhost — local uses return URL + /payment/query confirm
  if (/localhost|127\.0\.0\.1/i.test(env.API_URL)) {
    return undefined;
  }
  return `${env.API_URL.replace(/\/$/, '')}/api/v1/webhooks/paytabs`;
}

export function getPaytabsReturnUrl(): string {
  // Must hit the API bridge (accepts PayTabs POST). SPA paths reject POST with 405.
  // Prefer storefront origin + /api proxy so the browser stays on the shop domain.
  return `${env.storefrontUrl.replace(/\/$/, '')}/api/v1/checkout/meps/return`;
}

export async function createHostedPayment(input: {
  cartId: string;
  amount: number;
  description: string;
  customer: PaytabsCustomer;
}): Promise<{ tranRef: string; redirectUrl: string }> {
  const customer = {
    name: input.customer.name,
    email: input.customer.email,
    phone: input.customer.phone,
    street1: input.customer.street,
    city: input.customer.city,
    state: input.customer.state,
    country: input.customer.country ?? 'JO',
    zip: input.customer.zip ?? '00000',
    ip: input.customer.ip ?? '127.0.0.1',
  };

  const callback = getPaytabsCallbackUrl();
  const data = await paytabsFetch('/payment/request', {
    profile_id: Number(env.paytabsProfileId) || env.paytabsProfileId,
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: input.cartId,
    cart_currency: 'JOD',
    cart_amount: Math.round(input.amount * 1000) / 1000,
    cart_description: input.description,
    paypage_lang: 'ar',
    customer_details: customer,
    shipping_details: customer,
    ...(callback ? { callback } : {}),
    return: getPaytabsReturnUrl(),
  });

  if (!data.redirect_url || !data.tran_ref) {
    const msg = data.message || data.payment_result?.response_message || 'PayTabs did not return a payment page';
    throw new AppError(502, ErrorCodes.VALIDATION_ERROR, msg);
  }

  return { tranRef: data.tran_ref, redirectUrl: data.redirect_url };
}

export async function queryTransaction(opts: {
  tranRef?: string;
  cartId?: string;
}): Promise<PaytabsHostedResponse | PaytabsHostedResponse[]> {
  requireMeps();
  if (!opts.tranRef && !opts.cartId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'tranRef or cartId required');
  }
  const body: Record<string, unknown> = {
    profile_id: Number(env.paytabsProfileId) || env.paytabsProfileId,
  };
  if (opts.tranRef) body.tran_ref = opts.tranRef;
  else body.cart_id = opts.cartId;

  return paytabsFetch('/payment/query', body) as Promise<PaytabsHostedResponse | PaytabsHostedResponse[]>;
}

/** True when PayTabs reports authorised (A). */
export function isPaytabsAuthorised(result: PaytabsHostedResponse | PaytabsHostedResponse[]): boolean {
  const rows = Array.isArray(result) ? result : [result];
  return rows.some((r) => r.payment_result?.response_status === 'A');
}

export function pickPaytabsTranRef(
  result: PaytabsHostedResponse | PaytabsHostedResponse[],
): string | undefined {
  const rows = Array.isArray(result) ? result : [result];
  return rows.find((r) => r.tran_ref)?.tran_ref;
}

export function verifyCallbackSignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
  requireMeps();
  if (!signatureHeader) return false;
  const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = createHmac('sha256', env.paytabsServerKey).update(payload).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signatureHeader, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
