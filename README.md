# Stellar Privacy SDK backend demo

Reference NestJS app that runs `@arcanetech/privacy-sdk-stellar/node` on the server. It derives HD testnet accounts, funds them with Friendbot, deposits native XLM into the privacy pool, then sends private transfers through a relayer-service.

No browser wallet. All SDK calls happen in Node.

## What you need

- Docker (recommended) or Node 20 + Postgres 16
- Live stand values: pool, registry, KYT inspect API (same origin as the payment client `VITE_API_BASE_URL`), `APPLICATION_ID` as `association.audit_id` (decimal Fr, not a Compliance UUID), audit public key, `zkConfigNonce`
- A BIP-39 `STELLAR_MNEMONIC` (secrets stay in env, not in the database)

Tutorial fixture contract IDs from the public docs will not confirm on testnet. Use the same stand as your payment UI.

1. Click **Setup accounts** (derives HD keys, Friendbot, registry)
2. **Deposit** from account 0
3. **Start** the simulator and watch private transfers, balances, and the log
4. **Stop**
5. **Withdraw**

## Local Node

Start Postgres (or `docker compose up postgres`), set `DATABASE_URL` to `localhost`, then:

```bash
npm install
npm run start:dev
```

Run the relayer the same way from `relayer-service`. Point `RELAYER_ORIGIN` at `http://localhost:3010/api`.

## API

- `GET /api/state`
- `POST /api/setup`
- `POST /api/deposit` `{ "amountXlm": 10 }`
- `POST /api/simulator/start` `{ "amountXlm": 1, "transactionsPerMinute": 2 }`
- `POST /api/simulator/stop`
- `POST /api/withdraw` `{ "accountIndex": 0, "amountXlm": 1 }`

## Notes

- Private-sender transfers go to `relayer-service` via `@arcanetech/privacy-sdk-relay`. Deposit uses Direct Submission (`execute()`).
- Incoming notes for other HD accounts are remapped onto the recipient G-address after each transfer (delivery step).
- SDK domain state is a JSONB snapshot of the official in-memory adapter. Restart keeps notes and simulator counters.
- If a live step cannot be done through the public SDK, stop and treat it as an SDK gap — do not add workarounds that hide missing APIs.
