# Blockchain Event Ticketing dApp

A blockchain-based event ticketing dApp built for a hackathon.

This project lets an organizer create events, lets users claim unique on-chain tickets, generates a QR code for each ticket, and allows organizers to verify and consume tickets at entry.

## What It Does

- Organizers can create events
- Users can get a ticket for an event
- Each ticket is stored uniquely on-chain
- A QR code is generated for each ticket
- Organizers can verify tickets at entry
- A ticket can only be used once

## Why This Matters

Traditional ticketing systems can suffer from duplication, fake tickets, and unclear ownership. This dApp uses blockchain to make tickets:

- unique
- tamper-resistant
- publicly verifiable
- single-use

## Tech Stack

- Solidity
- Hardhat
- Ethers.js
- HTML, CSS, JavaScript
- Sepolia testnet

## Project Structure

```text
contracts/                Smart contracts
scripts/                  Deployment scripts
test/                     Contract tests
frontend/                 Static frontend
  index.html              Role selection page
  organizer.html          Organizer/admin page
  attendee.html           Attendee page
  shared.js               Shared frontend contract logic
```

## Frontend Roles

The frontend is split into two role-specific pages:

- `organizer.html`
  - create events
  - view all events
  - view events created by the connected organizer
  - verify tickets
  - scan QR codes
  - mark tickets as used

- `attendee.html`
  - browse available events
  - get a ticket
  - view only tickets owned by the connected wallet
  - generate and download ticket QR codes

## Smart Contract Notes

The contract is intentionally simple for demo purposes.

- Event creator becomes that event’s admin
- Only the event admin can mark a ticket as used
- Tickets are free in contract value
- Users still need Sepolia ETH for gas when calling `getTicket()`

Important note:

Blockchain data is public. The frontend filters what each role sees, but the underlying on-chain data is not private.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile

```bash
npm run compile
```

### 3. Run Tests

```bash
npm test
```

## Local Development

### Start a Local Hardhat Node

```bash
npx hardhat node
```

### Deploy Locally

In a second terminal:

```bash
npm run deploy:localhost
```

### Run the Frontend Locally

```bash
npx serve frontend
```

## Deploying to Sepolia

Before deployment, set the following environment variables:

```bash
export SEPOLIA_RPC_URL="https://your-sepolia-rpc-url"
export SEPOLIA_PRIVATE_KEY="0xyour_ethereum_private_key"
```

Then deploy:

```bash
npm run deploy:sepolia
```

After deployment:

1. Copy the deployed contract address from the terminal output
2. Open `frontend/shared.js`
3. Replace:

```js
const DEPLOYED_CONTRACT_ADDRESS = "PASTE_YOUR_SEPOLIA_CONTRACT_ADDRESS_HERE";
```

with your real Sepolia contract address

## Available Commands

```bash
npm run compile
npm run deploy
npm run deploy:localhost
npm run deploy:sepolia
npm test
```

## Demo Setup

For the best demo experience:

- use one organizer/admin wallet
- use one attendee wallet
- fund both with a small amount of Sepolia ETH

Recommended demo flow:

1. Organizer connects wallet
2. Organizer creates an event
3. Attendee connects a different wallet
4. Attendee gets a ticket
5. Attendee opens the QR code
6. Organizer verifies the ticket
7. Organizer marks it as used
8. Re-check to show the ticket cannot be reused

## Hosting

Since the frontend is static, it can be hosted on:

- Vercel
- Netlify
- GitHub Pages

Recommended for hackathon demos:

- GitHub for source code
- Vercel for hosting

## Future Improvements

- sponsored transactions for users without test ETH
- NFT-based ticket ownership
- better event and ticket indexing
- organizer dashboard analytics
- stronger anti-sharing ticket verification flow

## License

MIT
