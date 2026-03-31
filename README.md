# Ticket Verification App

Blockchain-based event ticketing dApp built with Hardhat and Solidity.

## Available Commands

```bash
npm run compile
npm run deploy
npm run deploy:localhost
npm run deploy:sepolia
npm test
```

## What Was Added

- A deploy script at `scripts/deploy.ts`
- Contract tests at `test/EventTicketing.test.ts`
- A simple frontend in `frontend/`

## Notes

- `npm run deploy` uses the default Hardhat network configuration.
- `npm run deploy:localhost` is for a local JSON-RPC node such as `npx hardhat node`.
- `npm run deploy:sepolia` deploys to the public Sepolia testnet.
- `npm test` compiles the contract and runs the Node.js contract test suite.

## Sepolia Setup

Before running `npm run deploy:sepolia`, set these configuration variables:

```bash
export SEPOLIA_RPC_URL="https://your-sepolia-rpc-url"
export SEPOLIA_PRIVATE_KEY="0xyourwalletprivatekey"
```

The deployer wallet should hold some Sepolia ETH.

## Best Demo Flow For Judges

For a hackathon demo, the best setup is:

1. Deploy the smart contract to Sepolia.
2. Host the frontend publicly on a service like Vercel or Netlify.
3. Keep ticket creation free in the contract.
4. Provide a dedicated demo MetaMask wallet with a small amount of Sepolia ETH.

Why this is the best option:

- Judges can access the app from anywhere.
- The blockchain state is public and persistent.
- Judges do not need to request faucet funds themselves.
- You avoid the local Hardhat network disappearing when your laptop stops.

Recommended wallet split:

- Organizer wallet: creates events and verifies tickets
- Demo attendee wallet: claims tickets during the demo

Important:

- Use a fresh demo wallet that holds only Sepolia ETH.
- Do not use your personal wallet private key for the judge flow.
- `getTicket()` is free in contract value, but still costs Sepolia gas because it writes on-chain.
