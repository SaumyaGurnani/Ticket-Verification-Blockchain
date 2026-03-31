import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BaseContract, ContractTransactionResponse, Signer } from "ethers";

import { network } from "hardhat";

const { ethers } = await network.connect();

type EventStruct = {
  id: bigint;
  name: string;
  admin: string;
  maxTickets: bigint;
  ticketsIssued: bigint;
};

type TicketStruct = {
  id: bigint;
  eventId: bigint;
  owner: string;
  used: boolean;
};

type EventTicketingContract = BaseContract & {
  createEvent(name: string, maxTickets: number | bigint): Promise<ContractTransactionResponse>;
  getTicket(eventId: number | bigint): Promise<ContractTransactionResponse>;
  verifyTicket(ticketId: number | bigint): Promise<boolean>;
  useTicket(ticketId: number | bigint): Promise<ContractTransactionResponse>;
  eventCount(): Promise<bigint>;
  ticketCount(): Promise<bigint>;
  events(eventId: number | bigint): Promise<EventStruct>;
  tickets(ticketId: number | bigint): Promise<TicketStruct>;
  waitForDeployment(): Promise<EventTicketingContract>;
  connect(signer: Signer): EventTicketingContract;
};

function asEventTicketingContract(contract: BaseContract): EventTicketingContract {
  return contract as unknown as EventTicketingContract;
}

async function expectRevert(
  txPromise: Promise<ContractTransactionResponse>,
  message: RegExp,
) {
  await assert.rejects(
    (async () => {
      const tx = await txPromise;
      await tx.wait();
    })(),
    message,
  );
}

async function deployFixture() {
  const [organizer, attendee, anotherAttendee] = await ethers.getSigners();
  const contract = asEventTicketingContract(
    await ethers.deployContract("EventTicketing"),
  );
  await contract.waitForDeployment();

  return {
    contract,
    organizer,
    attendee,
    anotherAttendee,
  };
}

describe("EventTicketing", async function () {
  it("creates an event and stores the organizer as admin", async function () {
    const { contract, organizer } = await deployFixture();

    const tx = await contract.createEvent("Hackathon Demo Day", 100);
    await tx.wait();

    const eventCount = await contract.eventCount();
    const eventData = await contract.events(1);

    assert.equal(eventCount, 1n);
    assert.equal(eventData.id, 1n);
    assert.equal(eventData.name, "Hackathon Demo Day");
    assert.equal(eventData.admin, organizer.address);
    assert.equal(eventData.maxTickets, 100n);
    assert.equal(eventData.ticketsIssued, 0n);
  });

  it("rejects invalid event creation input", async function () {
    const { contract } = await deployFixture();

    await expectRevert(
      contract.createEvent("", 10),
      /Event name required/,
    );

    await expectRevert(
      contract.createEvent("Demo", 0),
      /Max tickets must be greater than zero/,
    );
  });

  it("issues unique tickets and updates the event counter", async function () {
    const { contract, attendee, anotherAttendee } = await deployFixture();

    await (await contract.createEvent("Web3 Summit", 2)).wait();
    await (await asEventTicketingContract(contract.connect(attendee)).getTicket(1)).wait();
    await (await asEventTicketingContract(contract.connect(anotherAttendee)).getTicket(1)).wait();

    const ticketCount = await contract.ticketCount();
    const firstTicket = await contract.tickets(1);
    const secondTicket = await contract.tickets(2);
    const eventData = await contract.events(1);

    assert.equal(ticketCount, 2n);
    assert.equal(firstTicket.owner, attendee.address);
    assert.equal(secondTicket.owner, anotherAttendee.address);
    assert.equal(firstTicket.used, false);
    assert.equal(secondTicket.used, false);
    assert.equal(eventData.ticketsIssued, 2n);
  });

  it("rejects ticket minting for missing or sold out events", async function () {
    const { contract, attendee, anotherAttendee } = await deployFixture();

    await expectRevert(
      asEventTicketingContract(contract.connect(attendee)).getTicket(1),
      /Event does not exist/,
    );

    await (await contract.createEvent("Limited Entry", 1)).wait();
    await (await asEventTicketingContract(contract.connect(attendee)).getTicket(1)).wait();

    await expectRevert(
      asEventTicketingContract(contract.connect(anotherAttendee)).getTicket(1),
      /Sold out/,
    );
  });

  it("verifies a fresh ticket and invalidates it after use", async function () {
    const { contract, organizer, attendee } = await deployFixture();

    await (await asEventTicketingContract(contract.connect(organizer)).createEvent("Final Round", 5)).wait();
    await (await asEventTicketingContract(contract.connect(attendee)).getTicket(1)).wait();

    assert.equal(await contract.verifyTicket(1), true);

    await (await asEventTicketingContract(contract.connect(organizer)).useTicket(1)).wait();

    assert.equal(await contract.verifyTicket(1), false);

    const ticket = await contract.tickets(1);
    assert.equal(ticket.used, true);
  });

  it("only allows the event admin to mark a ticket as used", async function () {
    const { contract, organizer, attendee, anotherAttendee } = await deployFixture();

    await (await asEventTicketingContract(contract.connect(organizer)).createEvent("VIP Access", 3)).wait();
    await (await asEventTicketingContract(contract.connect(attendee)).getTicket(1)).wait();

    await expectRevert(
      asEventTicketingContract(contract.connect(anotherAttendee)).useTicket(1),
      /Only admin can verify/,
    );
  });

  it("rejects reusing the same ticket", async function () {
    const { contract, organizer, attendee } = await deployFixture();

    await (await asEventTicketingContract(contract.connect(organizer)).createEvent("Entry Gate", 3)).wait();
    await (await asEventTicketingContract(contract.connect(attendee)).getTicket(1)).wait();
    await (await asEventTicketingContract(contract.connect(organizer)).useTicket(1)).wait();

    await expectRevert(
      asEventTicketingContract(contract.connect(organizer)).useTicket(1),
      /Already used/,
    );
  });

  it("returns false when verifying a nonexistent ticket", async function () {
    const { contract } = await deployFixture();

    assert.equal(await contract.verifyTicket(999), false);
  });
});
