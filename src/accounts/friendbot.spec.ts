import { ALREADY_FUNDED_DETAIL, fundNativeViaFriendbot } from './friendbot';

describe('fundNativeViaFriendbot', () => {
  it('treats already funded as success', async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ detail: ALREADY_FUNDED_DETAIL }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    await expect(
      fundNativeViaFriendbot('GTEST', 'https://friendbot.stellar.org', fetchImpl),
    ).resolves.toBe('already_funded');
  });

  it('returns funded on HTTP 200', async () => {
    const fetchImpl = async () => new Response('ok', { status: 200 });
    await expect(
      fundNativeViaFriendbot('GTEST', 'https://friendbot.stellar.org', fetchImpl),
    ).resolves.toBe('funded');
  });
});
