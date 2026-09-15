export const ALREADY_FUNDED_DETAIL = 'account already funded to starting balance';

export type FriendbotFundingResult = 'funded' | 'already_funded';

export async function fundNativeViaFriendbot(
  publicKey: string,
  friendbotUrl = 'https://friendbot.stellar.org',
  fetchImpl: typeof fetch = fetch,
): Promise<FriendbotFundingResult> {
  const url = `${friendbotUrl.replace(/\/$/u, '')}?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetchImpl(url);
  if (response.ok) {
    return 'funded';
  }
  if (response.status === 400) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    if (
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      body.detail === ALREADY_FUNDED_DETAIL
    ) {
      return 'already_funded';
    }
    return 'already_funded';
  }
  throw new Error(`Friendbot error: ${String(response.status)}`);
}
