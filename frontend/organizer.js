import {
  appState,
  connectWallet,
  fetchAllEvents,
  fetchEventById,
  fetchTicketById,
  getErrorMessage,
  installWalletReloadHandlers,
  refreshEvents,
  requireContract,
  setStatus,
  setupContract,
  startScanner,
  stopScanner,
  toNumber,
} from "./shared.js";

const els = {
  connectWalletBtn: document.getElementById("connectWalletBtn"),
  walletStatus: document.getElementById("walletStatus"),
  networkName: document.getElementById("networkName"),
  accountAddress: document.getElementById("accountAddress"),
  contractStatus: document.getElementById("contractStatus"),
  createEventForm: document.getElementById("createEventForm"),
  eventName: document.getElementById("eventName"),
  maxTickets: document.getElementById("maxTickets"),
  refreshEventsBtn: document.getElementById("refreshEventsBtn"),
  eventsList: document.getElementById("eventsList"),
  myEventsList: document.getElementById("myEventsList"),
  verifyTicketForm: document.getElementById("verifyTicketForm"),
  verifyTicketId: document.getElementById("verifyTicketId"),
  useTicketBtn: document.getElementById("useTicketBtn"),
  verifyStatusCard: document.getElementById("verifyStatusCard"),
  verifyBadge: document.getElementById("verifyBadge"),
  verifyHeadline: document.getElementById("verifyHeadline"),
  verifyStatus: document.getElementById("verifyStatus"),
  verifyMeta: document.getElementById("verifyMeta"),
  startScannerBtn: document.getElementById("startScannerBtn"),
  stopScannerBtn: document.getElementById("stopScannerBtn"),
  scannerStatus: document.getElementById("scannerStatus"),
};

function renderVerifyState({
  tone = "neutral",
  badge = "Waiting",
  headline = "Verification result will appear here.",
  message = "Verification checks whether the ticket exists and has not been used.",
  meta = [],
}) {
  els.verifyStatusCard.className = `verify-card ${tone}`.trim();
  els.verifyBadge.className = `verify-badge ${tone}`.trim();
  els.verifyBadge.textContent = badge;
  els.verifyHeadline.textContent = headline;
  els.verifyStatus.textContent = message;
  els.verifyMeta.innerHTML = meta
    .map((item) => `<span class="verify-chip">${item}</span>`)
    .join("");
}

async function createEvent(event) {
  event.preventDefault();

  try {
    requireContract();

    const name = els.eventName.value.trim();
    const maxTickets = Number(els.maxTickets.value);

    if (!name) {
      throw new Error("Event name is required.");
    }

    if (!Number.isInteger(maxTickets) || maxTickets <= 0) {
      throw new Error("Maximum tickets must be greater than zero.");
    }

    const tx = await appState.contract.createEvent(name, maxTickets);
    setStatus(els.contractStatus, "Creating event on-chain. Waiting for confirmation...");
    await tx.wait();

    els.createEventForm.reset();
    setStatus(els.contractStatus, `Event "${name}" created successfully.`, "success");
    await refreshAllEventViews();
  } catch (error) {
    setStatus(els.contractStatus, getErrorMessage(error), "error");
  }
}

async function refreshAllEventViews() {
  try {
    await refreshEvents(els.eventsList);

    const events = await fetchAllEvents();
    const myEvents = events.filter(
      (event) => appState.account && event.admin.toLowerCase() === appState.account.toLowerCase(),
    );

    if (myEvents.length === 0) {
      els.myEventsList.className = "card-list empty-state";
      els.myEventsList.textContent = "You have not created any events yet.";
      return;
    }

    els.myEventsList.className = "card-list";
    els.myEventsList.innerHTML = myEvents
      .map(
        (event) => `
          <article class="event-card featured-card">
            <div class="ticket-card-top">
              <strong>#${event.id} - ${event.name}</strong>
              <span class="mini-badge active">Admin</span>
            </div>
            <span>Tickets: ${event.ticketsIssued} / ${event.maxTickets}</span>
            <span>You can verify tickets only for this event.</span>
          </article>
        `,
      )
      .join("");
  } catch (error) {
    els.eventsList.className = "card-list empty-state";
    els.eventsList.textContent = getErrorMessage(error);
    els.myEventsList.className = "card-list empty-state";
    els.myEventsList.textContent = getErrorMessage(error);
  }
}

async function verifyTicket(event) {
  event.preventDefault();
  await verifyTicketById(Number(els.verifyTicketId.value));
}

async function verifyTicketById(ticketId) {
  try {
    requireContract();

    const ticket = await fetchTicketById(ticketId);
    const event = await fetchEventById(ticket.eventId);

    if (!appState.account || event.admin.toLowerCase() !== appState.account.toLowerCase()) {
      throw new Error("You can only verify tickets for events created by your wallet.");
    }

    const isValid = await appState.contract.verifyTicket(ticketId);

    renderVerifyState({
      tone: isValid ? "success" : "error",
      badge: isValid ? "Valid" : "Rejected",
      headline: isValid
        ? `Ticket #${ticketId} is ready for entry`
        : `Ticket #${ticketId} cannot be used for entry`,
      message: isValid
        ? "The ticket exists on-chain and has not been used yet."
        : ticket.used
          ? "This ticket has already been used and cannot be scanned again."
          : "This ticket failed verification.",
      meta: [
        `Event #${ticket.eventId} - ${event.name}`,
        `Owner ${ticket.owner.slice(0, 6)}...${ticket.owner.slice(-4)}`,
        ticket.used ? "Status: Used" : "Status: Unused",
      ],
    });
    els.useTicketBtn.disabled = !isValid;
  } catch (error) {
    renderVerifyState({
      tone: "error",
      badge: "Error",
      headline: "Verification failed",
      message: getErrorMessage(error),
      meta: [],
    });
    els.useTicketBtn.disabled = true;
  }
}

async function markTicketUsed() {
  try {
    requireContract();

    const ticketId = Number(els.verifyTicketId.value);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new Error("Enter a valid ticket ID.");
    }

    const tx = await appState.contract.useTicket(ticketId);
    renderVerifyState({
      tone: "neutral",
      badge: "Pending",
      headline: "Submitting ticket usage",
      message: "Waiting for the organizer transaction to confirm on-chain.",
      meta: [`Ticket #${ticketId}`],
    });
    await tx.wait();

    const ticket = await fetchTicketById(ticketId);
    const event = await fetchEventById(ticket.eventId);
    renderVerifyState({
      tone: "used",
      badge: "Used",
      headline: `Ticket #${ticketId} has been consumed`,
      message: "Entry has been recorded on-chain. This ticket can no longer be reused.",
      meta: [
        `Event #${ticket.eventId} - ${event.name}`,
        `Owner ${ticket.owner.slice(0, 6)}...${ticket.owner.slice(-4)}`,
        "Status: Used",
      ],
    });
    els.useTicketBtn.disabled = true;
  } catch (error) {
    renderVerifyState({
      tone: "error",
      badge: "Error",
      headline: "Could not mark ticket as used",
      message: getErrorMessage(error),
      meta: [],
    });
  }
}

async function handleScannedTicket(ticketId) {
  els.verifyTicketId.value = String(ticketId);
  await verifyTicketById(ticketId);
}

function wireEvents() {
  els.connectWalletBtn.addEventListener("click", () =>
    connectWallet({
      walletStatus: els.walletStatus,
      networkName: els.networkName,
      accountAddress: els.accountAddress,
      contractStatus: els.contractStatus,
      onConnected: refreshAllEventViews,
    }),
  );
  els.createEventForm.addEventListener("submit", createEvent);
  els.refreshEventsBtn.addEventListener("click", refreshAllEventViews);
  els.verifyTicketForm.addEventListener("submit", verifyTicket);
  els.useTicketBtn.addEventListener("click", markTicketUsed);
  els.startScannerBtn.addEventListener("click", () =>
    startScanner({
      readerId: "reader",
      scannerStatus: els.scannerStatus,
      onTicketScanned: handleScannedTicket,
      startButton: els.startScannerBtn,
      stopButton: els.stopScannerBtn,
    }),
  );
  els.stopScannerBtn.addEventListener("click", () =>
    stopScanner({
      scannerStatus: els.scannerStatus,
      startButton: els.startScannerBtn,
      stopButton: els.stopScannerBtn,
    }),
  );
}

void setupContract(els.contractStatus);
installWalletReloadHandlers();
wireEvents();
