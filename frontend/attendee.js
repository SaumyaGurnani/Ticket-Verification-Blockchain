import {
  appState,
  clearQrCanvas,
  connectWallet,
  fetchTicketsForOwner,
  getErrorMessage,
  installWalletReloadHandlers,
  LAST_TICKET_STORAGE_KEY,
  refreshEvents,
  requireContract,
  setStatus,
  setupContract,
} from "./shared.js";

const els = {
  connectWalletBtn: document.getElementById("connectWalletBtn"),
  walletStatus: document.getElementById("walletStatus"),
  networkName: document.getElementById("networkName"),
  accountAddress: document.getElementById("accountAddress"),
  contractStatus: document.getElementById("contractStatus"),
  getTicketForm: document.getElementById("getTicketForm"),
  ticketEventId: document.getElementById("ticketEventId"),
  ticketMintStatus: document.getElementById("ticketMintStatus"),
  refreshEventsBtn: document.getElementById("refreshEventsBtn"),
  eventsList: document.getElementById("eventsList"),
  refreshMyTicketsBtn: document.getElementById("refreshMyTicketsBtn"),
  myTicketsList: document.getElementById("myTicketsList"),
  ticketDetails: document.getElementById("ticketDetails"),
  qrCanvas: document.getElementById("qrCanvas"),
  qrTicketIdLabel: document.getElementById("qrTicketIdLabel"),
  downloadQrBtn: document.getElementById("downloadQrBtn"),
};

async function getTicket(event) {
  event.preventDefault();

  try {
    requireContract();

    const eventId = Number(els.ticketEventId.value);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw new Error("Enter a valid event ID.");
    }

    const beforeCount = Number((await appState.contract.ticketCount()).toString());
    const tx = await appState.contract.getTicket(eventId);
    setStatus(els.ticketMintStatus, "Minting ticket. Waiting for confirmation...");
    await tx.wait();

    const afterCount = Number((await appState.contract.ticketCount()).toString());
    const newTicketId = afterCount > beforeCount ? afterCount : null;

    if (newTicketId) {
      localStorage.setItem(LAST_TICKET_STORAGE_KEY, String(newTicketId));
      await refreshMyTickets();
      await loadTicketById(newTicketId);
      setStatus(
        els.ticketMintStatus,
        `Ticket minted successfully. New ticket ID: ${newTicketId}.`,
        "success",
      );
    } else {
      setStatus(
        els.ticketMintStatus,
        "Ticket minted, but the new ticket ID could not be inferred automatically.",
        "success",
      );
    }

    els.getTicketForm.reset();
    await refreshEvents(els.eventsList);
  } catch (error) {
    setStatus(els.ticketMintStatus, getErrorMessage(error), "error");
  }
}

async function loadTicketById(ticketId) {
  try {
    const ownedTickets = await fetchTicketsForOwner(appState.account);
    const ticket = ownedTickets.find((item) => item.ticketId === ticketId);

    if (!ticket) {
      throw new Error("You can only view QR codes for tickets owned by your connected wallet.");
    }

    appState.lastLoadedTicket = ticket;
    els.ticketDetails.className = `ticket-details showcase-card ${ticket.used ? "used" : "active"}`;
    els.ticketDetails.innerHTML = `
      <div class="detail-header">
        <span class="detail-badge ${ticket.used ? "used" : "active"}">
          ${ticket.used ? "Used" : "Valid"}
        </span>
        <strong>Ticket #${ticket.ticketId}</strong>
      </div>
      <div class="detail-grid">
        <span class="detail-chip">Event #${ticket.eventId}</span>
        <span class="detail-chip">Owner ${ticket.owner.slice(0, 6)}...${ticket.owner.slice(-4)}</span>
        <span class="detail-chip">${ticket.used ? "No longer valid for entry" : "Ready for scanning"}</span>
      </div>
    `;

    await window.QRCode.toCanvas(els.qrCanvas, JSON.stringify(ticket), {
      width: 220,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    });

    els.qrTicketIdLabel.className = "qr-ticket-id";
    els.qrTicketIdLabel.textContent = `Ticket ID: ${ticket.ticketId}`;
    els.downloadQrBtn.disabled = false;
  } catch (error) {
    appState.lastLoadedTicket = null;
    clearQrCanvas(els.qrCanvas);
    els.qrTicketIdLabel.className = "qr-ticket-id muted";
    els.qrTicketIdLabel.textContent = "Ticket ID will appear here.";
    els.downloadQrBtn.disabled = true;
    els.ticketDetails.className = "ticket-details muted";
    els.ticketDetails.textContent = getErrorMessage(error);
  }
}

async function refreshMyTickets() {
  try {
    requireContract();

    const tickets = await fetchTicketsForOwner(appState.account);

    if (tickets.length === 0) {
      els.myTicketsList.className = "card-list empty-state";
      els.myTicketsList.textContent = "You do not own any tickets yet.";
      appState.lastLoadedTicket = null;
      clearQrCanvas(els.qrCanvas);
      els.ticketDetails.className = "ticket-details muted";
      els.ticketDetails.textContent = "Claim a ticket to see its QR here.";
      els.qrTicketIdLabel.className = "qr-ticket-id muted";
      els.qrTicketIdLabel.textContent = "Ticket ID will appear here.";
      els.downloadQrBtn.disabled = true;
      return;
    }

    els.myTicketsList.className = "card-list";
    els.myTicketsList.innerHTML = tickets
      .map(
        (ticket) => `
          <article class="event-card ticket-card ${ticket.used ? "ticket-card-used" : "ticket-card-active"}">
            <div class="ticket-card-top">
              <strong>Ticket #${ticket.ticketId}</strong>
              <span class="mini-badge ${ticket.used ? "used" : "active"}">
                ${ticket.used ? "Used" : "Ready"}
              </span>
            </div>
            <span>Event #${ticket.eventId}</span>
            <span>${ticket.used ? "Already checked in" : "Available for entry"}</span>
            <button type="button" class="secondary-btn view-ticket-btn" data-ticket-id="${ticket.ticketId}">
              View QR
            </button>
          </article>
        `,
      )
      .join("");
  } catch (error) {
    els.myTicketsList.className = "card-list empty-state";
    els.myTicketsList.textContent = getErrorMessage(error);
  }
}

function downloadQr() {
  if (!appState.lastLoadedTicket) {
    return;
  }

  const link = document.createElement("a");
  link.href = els.qrCanvas.toDataURL("image/png");
  link.download = `ticket-${appState.lastLoadedTicket.ticketId}.png`;
  link.click();
}

function restoreSavedState() {
  return localStorage.getItem(LAST_TICKET_STORAGE_KEY);
}

function wireEvents() {
  els.connectWalletBtn.addEventListener("click", () =>
    connectWallet({
      walletStatus: els.walletStatus,
      networkName: els.networkName,
      accountAddress: els.accountAddress,
      contractStatus: els.contractStatus,
      onConnected: async () => {
        await refreshEvents(els.eventsList);
        await refreshMyTickets();
        const lastTicketId = restoreSavedState();
        if (lastTicketId) {
          await loadTicketById(Number(lastTicketId));
        }
      },
    }),
  );
  els.getTicketForm.addEventListener("submit", getTicket);
  els.refreshEventsBtn.addEventListener("click", () => refreshEvents(els.eventsList));
  els.refreshMyTicketsBtn.addEventListener("click", refreshMyTickets);
  els.myTicketsList.addEventListener("click", (event) => {
    const button = event.target.closest(".view-ticket-btn");
    if (!button) {
      return;
    }

    const ticketId = Number(button.dataset.ticketId);
    void loadTicketById(ticketId);
  });
  els.downloadQrBtn.addEventListener("click", downloadQr);
}

void setupContract(els.contractStatus);
installWalletReloadHandlers();
wireEvents();
