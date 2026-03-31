import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventTicketingModule = buildModule("EventTicketingModule", (m) => {
  const eventTicketing = m.contract("EventTicketing");
  return { eventTicketing };
});

export default EventTicketingModule;
