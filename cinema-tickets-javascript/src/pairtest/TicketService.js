import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #ADULT_PRICE = 20;
  #CHILD_PRICE = 10;
  #INFANT_PRICE = 0;
  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);

    const { totalCost, totalTickets, adultTicketsCount } =
      this.#calculateTicketCostAndCounts(ticketTypeRequests);

    this.#validateTicketLimits(totalTickets);

    this.#validateAdultPresenceWithChildOrInfant(
      adultTicketsCount,
      ticketTypeRequests
    );

    const ticketPaymentService = new TicketPaymentService();
    const seatReservationService = new SeatReservationService();

    ticketPaymentService.makePayment(accountId, totalCost);
    seatReservationService.reserveSeat(accountId, totalTickets);

    return `Tickets purchased successfully. Total cost: ${totalCost}.`;
  }

  #validateAdultPresenceWithChildOrInfant(
    adultTicketsCount,
    ticketTypeRequests
  ) {
    const hasAdultTicket = adultTicketsCount > 0;
    const hasChildOrInfant = ticketTypeRequests.some(
      (request) =>
        request.getTicketType() === "CHILD" ||
        request.getTicketType() === "INFANT"
    );
    console.log(hasChildOrInfant && !hasAdultTicket);
    if (hasChildOrInfant && !hasAdultTicket) {
      throw new InvalidPurchaseException(
        "Adult should be there with child or infant"
      );
    }
  }

  #validateAccountId(accountId) {
    if (accountId <= 0) {
      throw new InvalidPurchaseException("accountId should be greater than 0");
    }
  }

  #calculateTicketCostAndCounts(ticketTypeRequests) {
    let totalCost = 0;
    let totalTickets = 0;
    let adultTicketsCount = 0;

    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        throw new TypeError(
          "Invalid ticketTypeRequests. Must be instances of TicketTypeRequest."
        );
      }

      const type = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      switch (type) {
        case "ADULT":
          totalCost += this.#ADULT_PRICE * noOfTickets;
          totalTickets += noOfTickets;
          adultTicketsCount = noOfTickets;
          break;
        case "CHILD":
          totalCost += this.#CHILD_PRICE * noOfTickets;
          totalTickets += noOfTickets;
          break;
        case "INFANT":
          totalCost += this.#INFANT_PRICE * noOfTickets;
          totalTickets += noOfTickets;
          break;
        default:
          throw new Error(`Unsupported ticket type: ${type}`);
      }
    }

    return { totalCost, totalTickets, adultTicketsCount };
  }

  #validateTicketLimits(totalTickets) {
    if (totalTickets >= 20) {
      throw new InvalidPurchaseException("Maximum ticket limit is 20");
    }
  }
}
