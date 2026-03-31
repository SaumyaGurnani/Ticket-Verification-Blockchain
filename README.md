# ChainPass

ChainPass is a blockchain-based event ticketing dApp.

It lets organizers create events, lets users claim unique on-chain tickets, generates a QR code for each ticket, and allows organizers to verify and use tickets only once.

## Demo Video  
[![Video Title](https://img.youtube.com/vi/JCIPIlkH0BA/0.jpg)](https://www.youtube.com/watch?v=JCIPIlkH0BA)

## Features

- Create events on-chain
- Claim unique tickets
- Generate QR codes for tickets
- Verify tickets from the organizer side
- Prevent the same ticket from being used twice

## Tech Stack

- Solidity
- Hardhat
- Ethers.js
- HTML, CSS, JavaScript
- Sepolia

## Project Structure

```text
contracts/    Smart contract
scripts/      Deployment script
test/         Contract tests
frontend/     Static frontend
```

## Install

```bash
npm install
```

## Run Locally

Start a local Hardhat node:

```bash
npx hardhat node
```

Deploy the contract locally:

```bash
npm run deploy:localhost
```

Start the frontend:

```bash
npx serve frontend
```

## Run Tests

```bash
npm test
```

## Deploy to Sepolia

Set your environment variables:

```bash
export SEPOLIA_RPC_URL="https://your-sepolia-rpc-url"
export SEPOLIA_PRIVATE_KEY="0xyour_ethereum_private_key"
```

Deploy:

```bash
npm run deploy:sepolia
```

If you redeploy the contract, update the hardcoded contract address in `frontend/shared.js`.
