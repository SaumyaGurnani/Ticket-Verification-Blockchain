# Frontend Usage

This is a simple static frontend for the `EventTicketing` smart contract.

## How to use it

1. Deploy your contract using Hardhat.
2. Open `frontend/index.html` through a local server.
3. Connect MetaMask.
4. Paste the deployed contract address into the app.

## Suggested local server

If you want a quick local server, run:

```bash
npx serve frontend
```

You can also use the VS Code Live Server extension or any static file server.

## What it supports

- Event creation
- Listing all events
- Ticket minting
- Ticket lookup from on-chain storage
- QR generation for a ticket payload
- QR scanning and admin verification
- Marking a ticket as used
