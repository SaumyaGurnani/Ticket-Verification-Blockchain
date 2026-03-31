export const LAST_TICKET_STORAGE_KEY = "ticketDapp.lastTicketId";
export const EXPECTED_CHAIN_ID = 11155111;
export const EXPECTED_NETWORK_NAME = "Sepolia";
export const DEPLOYED_CONTRACT_ADDRESS = "0x4e4184C65f1A37591D7A230561E535459F131205";

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "uint256", name: "_maxTickets", type: "uint256" },
    ],
    name: "createEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "eventCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "events",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "address", name: "admin", type: "address" },
      { internalType: "uint256", name: "maxTickets", type: "uint256" },
      { internalType: "uint256", name: "ticketsIssued", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_eventId", type: "uint256" }],
    name: "getTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "ticketCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tickets",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint256", name: "eventId", type: "uint256" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "bool", name: "used", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_ticketId", type: "uint256" }],
    name: "useTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_ticketId", type: "uint256" }],
    name: "verifyTicket",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

export const appState = {
  provider: null,
  signer: null,
  contract: null,
  account: null,
  chainId: null,
  scanner: null,
  lastLoadedTicket: null,
};

export function setStatus(element, message, tone = "") {
  element.textContent = message;
  element.className = `status-box ${tone}`.trim();
}

export function shortAddress(address) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function toNumber(value) {
  return Number(value.toString());
}

export function getConfiguredContractAddress() {
  return DEPLOYED_CONTRACT_ADDRESS.trim();
}

export function getErrorMessage(error) {
  if (error?.reason) {
    return error.reason;
  }

  if (error?.shortMessage) {
    return error.shortMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong.";
}

export function parseTicketInput(rawValue) {
  if (!rawValue) {
    throw new Error("Scanned QR is empty.");
  }

  const trimmed = rawValue.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const parsed = JSON.parse(trimmed);
  const ticketId = parsed.ticketId ?? parsed.id;

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw new Error("QR does not contain a valid ticket ID.");
  }

  return ticketId;
}

export function requireWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is required in the browser.");
  }

  if (!appState.signer) {
    throw new Error("Connect your wallet first.");
  }
}

export function requireContract() {
  requireWallet();

  if (!appState.contract) {
    throw new Error("The deployed contract is not configured yet.");
  }
}

export async function setupContract(statusElement) {
  const address = getConfiguredContractAddress();

  if (!address) {
    appState.contract = null;
    setStatus(
      statusElement,
      "Set DEPLOYED_CONTRACT_ADDRESS in frontend/shared.js before publishing the demo.",
      "error",
    );
    return;
  }

  if (!window.ethers.isAddress(address)) {
    appState.contract = null;
    setStatus(statusElement, "Contract address is not valid.", "error");
    return;
  }

  if (!appState.provider) {
    appState.contract = null;
    setStatus(statusElement, `Configured for contract ${shortAddress(address)}.`);
    return;
  }

  if (appState.chainId !== EXPECTED_CHAIN_ID) {
    appState.contract = null;
    setStatus(
      statusElement,
      `Switch MetaMask to ${EXPECTED_NETWORK_NAME} (${EXPECTED_CHAIN_ID}) to use this app.`,
      "error",
    );
    return;
  }

  appState.contract = new window.ethers.Contract(address, CONTRACT_ABI, appState.signer);
  setStatus(statusElement, `Connected to contract ${shortAddress(address)}.`, "success");
}

export async function connectWallet(walletEls) {
  const { walletStatus, networkName, accountAddress, contractStatus, onConnected } = walletEls;

  if (!window.ethereum) {
    setStatus(walletStatus, "MetaMask was not detected in this browser.", "error");
    return;
  }

  try {
    appState.provider = new window.ethers.BrowserProvider(window.ethereum);
    await appState.provider.send("eth_requestAccounts", []);
    appState.signer = await appState.provider.getSigner();
    appState.account = await appState.signer.getAddress();

    const network = await appState.provider.getNetwork();
    appState.chainId = Number(network.chainId);

    accountAddress.textContent = `Account: ${shortAddress(appState.account)}`;
    networkName.textContent = `Network: ${network.name} (${appState.chainId})`;
    walletStatus.textContent = "Wallet connected. You can now use contract functions.";

    await setupContract(contractStatus);
    if (typeof onConnected === "function") {
      await onConnected();
    }
  } catch (error) {
    setStatus(walletStatus, getErrorMessage(error), "error");
  }
}

export function installWalletReloadHandlers() {
  if (!window.ethereum) {
    return;
  }

  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

export async function refreshEvents(eventsList) {
  if (!appState.contract) {
    eventsList.className = "card-list empty-state";
    eventsList.textContent = `Connect your wallet on ${EXPECTED_NETWORK_NAME} to load events.`;
    return;
  }

  const events = await fetchAllEvents();

  if (events.length === 0) {
    eventsList.className = "card-list empty-state";
    eventsList.textContent = "No events created yet.";
    return;
  }

  const cards = events.map(
    (event) => `
      <article class="event-card">
        <strong>#${event.id} - ${event.name}</strong>
        <span>Admin: ${shortAddress(event.admin)}</span>
        <span>Tickets: ${event.ticketsIssued} / ${event.maxTickets}</span>
      </article>
    `,
  );

  eventsList.className = "card-list";
  eventsList.innerHTML = cards.join("");
}

export async function fetchAllEvents() {
  if (!appState.contract) {
    throw new Error(`Connect your wallet on ${EXPECTED_NETWORK_NAME} to load events.`);
  }

  const eventCount = toNumber(await appState.contract.eventCount());
  const events = [];

  for (let id = 1; id <= eventCount; id += 1) {
    const event = await appState.contract.events(id);
    events.push({
      id: toNumber(event.id),
      name: event.name,
      admin: event.admin,
      maxTickets: toNumber(event.maxTickets),
      ticketsIssued: toNumber(event.ticketsIssued),
    });
  }

  return events;
}

export async function fetchEventById(eventId) {
  requireContract();

  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("Enter a valid event ID.");
  }

  const event = await appState.contract.events(eventId);
  const onChainId = toNumber(event.id);

  if (onChainId === 0) {
    throw new Error("Event not found on-chain.");
  }

  return {
    id: onChainId,
    name: event.name,
    admin: event.admin,
    maxTickets: toNumber(event.maxTickets),
    ticketsIssued: toNumber(event.ticketsIssued),
  };
}

export async function fetchTicketById(ticketId) {
  requireContract();

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw new Error("Enter a valid ticket ID.");
  }

  const ticket = await appState.contract.tickets(ticketId);
  const onChainId = toNumber(ticket.id);

  if (onChainId === 0) {
    throw new Error("Ticket not found on-chain.");
  }

  return {
    contractAddress: getConfiguredContractAddress(),
    ticketId: onChainId,
    eventId: toNumber(ticket.eventId),
    owner: ticket.owner,
    used: ticket.used,
  };
}

export async function fetchTicketsForOwner(ownerAddress) {
  requireContract();

  const ticketCount = toNumber(await appState.contract.ticketCount());
  const tickets = [];

  for (let id = 1; id <= ticketCount; id += 1) {
    const ticket = await fetchTicketById(id);
    if (ticket.owner.toLowerCase() === ownerAddress.toLowerCase()) {
      tickets.push(ticket);
    }
  }

  return tickets;
}

export function clearQrCanvas(canvas) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export async function startScanner({ readerId, scannerStatus, onTicketScanned, startButton, stopButton }) {
  if (!window.Html5Qrcode) {
    setStatus(scannerStatus, "QR scanner library did not load.", "error");
    return;
  }

  if (appState.scanner) {
    setStatus(scannerStatus, "Scanner is already running.");
    return;
  }

  try {
    appState.scanner = new Html5Qrcode(readerId);
    await appState.scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 220 },
      (decodedText) => {
        try {
          const ticketId = parseTicketInput(decodedText);
          setStatus(scannerStatus, `Scanned ticket #${ticketId}.`, "success");
          void onTicketScanned(ticketId);
        } catch (error) {
          setStatus(scannerStatus, getErrorMessage(error), "error");
        }
      },
      () => {},
    );

    startButton.disabled = true;
    stopButton.disabled = false;
    setStatus(scannerStatus, "Scanner started. Point the camera at a ticket QR.");
  } catch (error) {
    setStatus(scannerStatus, getErrorMessage(error), "error");
    appState.scanner = null;
  }
}

export async function stopScanner({ scannerStatus, startButton, stopButton }) {
  if (!appState.scanner) {
    return;
  }

  try {
    await appState.scanner.stop();
    await appState.scanner.clear();
  } catch (error) {
    setStatus(scannerStatus, getErrorMessage(error), "error");
  } finally {
    appState.scanner = null;
    startButton.disabled = false;
    stopButton.disabled = true;
    setStatus(scannerStatus, "Camera is idle.");
  }
}
