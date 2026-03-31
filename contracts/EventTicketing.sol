// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventTicketing {

    uint public eventCount = 0;
    uint public ticketCount = 0;

    struct Event {
        uint id;
        string name;
        address admin;
        uint maxTickets;
        uint ticketsIssued;
    }

    struct Ticket {
        uint id;
        uint eventId;
        address owner;
        bool used;
    }

    mapping(uint => Event) public events;
    mapping(uint => Ticket) public tickets;

    function createEvent(string memory _name, uint _maxTickets) public {
        eventCount++;

        events[eventCount] = Event({
            id: eventCount,
            name: _name,
            admin: msg.sender,
            maxTickets: _maxTickets,
            ticketsIssued: 0
        });
    }

    function getTicket(uint _eventId) public {
        Event storage e = events[_eventId];

        require(e.id != 0, "Event does not exist");
        require(e.ticketsIssued < e.maxTickets, "Sold out");

        ticketCount++;

        tickets[ticketCount] = Ticket({
            id: ticketCount,
            eventId: _eventId,
            owner: msg.sender,
            used: false
        });

        e.ticketsIssued++;
    }

    function verifyTicket(uint _ticketId) public view returns (bool) {
        Ticket memory t = tickets[_ticketId];

        if (t.id == 0) return false;
        if (t.used) return false;

        return true;
    }

    function useTicket(uint _ticketId) public {
        Ticket storage t = tickets[_ticketId];
        Event memory e = events[t.eventId];

        require(t.id != 0, "Invalid ticket");
        require(!t.used, "Already used");
        require(msg.sender == e.admin, "Only admin can verify");

        t.used = true;
    }
}

