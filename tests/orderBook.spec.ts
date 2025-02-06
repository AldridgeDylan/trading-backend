import { OrderBook } from "../src/matching/orderBook";
import { Order } from "../src/models/order";
import logger from "../src/config/logger";

jest.mock("../src/config/logger");

describe("OrderBook", () => {
  let orderBook: OrderBook;

  beforeEach(() => {
    orderBook = new OrderBook();
  });

  describe("addOrder", () => {
    it("should add a BUY order and sort BUY orders by descending price (and createdAt ascending on tie)", () => {
      const order1: Order = {
        id: 1,
        userId: "user1",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      const order2: Order = {
        id: 2,
        userId: "user2",
        symbol: "AAPL",
        quantity: 5,
        price: 160,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const buyOrders = orderBook.getBuyOrders("AAPL");
      expect(buyOrders).toHaveLength(2);
      // Higher price order comes first.
      expect(buyOrders[0]).toEqual(order2);
      expect(buyOrders[1]).toEqual(order1);
    });

    it("should sort BUY orders with the same price by createdAt (earlier first)", () => {
      const order1: Order = {
        id: 3,
        userId: "user1",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      const order2: Order = {
        id: 4,
        userId: "user2",
        symbol: "AAPL",
        quantity: 5,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const buyOrders = orderBook.getBuyOrders("AAPL");
      expect(buyOrders).toHaveLength(2);
      // With equal prices, order with earlier creation time comes first.
      expect(buyOrders[0]).toEqual(order2);
      expect(buyOrders[1]).toEqual(order1);
    });

    it("should add a SELL order and sort SELL orders by ascending price (and createdAt ascending on tie)", () => {
      const order1: Order = {
        id: 5,
        userId: "user3",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      const order2: Order = {
        id: 6,
        userId: "user4",
        symbol: "AAPL",
        quantity: 5,
        price: 140,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const sellOrders = orderBook.getSellOrders("AAPL");
      expect(sellOrders).toHaveLength(2);
      // Lower price order comes first.
      expect(sellOrders[0]).toEqual(order2);
      expect(sellOrders[1]).toEqual(order1);
    });

    it("should sort SELL orders with the same price by createdAt (earlier first)", () => {
      const order1: Order = {
        id: 7,
        userId: "user5",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      const order2: Order = {
        id: 8,
        userId: "user6",
        symbol: "AAPL",
        quantity: 5,
        price: 150,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const sellOrders = orderBook.getSellOrders("AAPL");
      expect(sellOrders).toHaveLength(2);
      expect(sellOrders[0]).toEqual(order2);
      expect(sellOrders[1]).toEqual(order1);
    });
  });

  describe("removeOrder", () => {
    it("should remove a BUY order by id", () => {
      const order: Order = {
        id: 9,
        userId: "user7",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date()
      };

      orderBook.addOrder(order);
      expect(orderBook.getBuyOrders("AAPL")).toHaveLength(1);

      const removed = orderBook.removeOrder(9);
      expect(removed).toBe(true);
      expect(orderBook.getBuyOrders("AAPL")).toHaveLength(0);
    });

    it("should remove a SELL order by id", () => {
      const order: Order = {
        id: 10,
        userId: "user8",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date()
      };

      orderBook.addOrder(order);
      expect(orderBook.getSellOrders("AAPL")).toHaveLength(1);

      const removed = orderBook.removeOrder(10);
      expect(removed).toBe(true);
      expect(orderBook.getSellOrders("AAPL")).toHaveLength(0);
    });

    it("should return false when removing a non-existent order", () => {
      const removed = orderBook.removeOrder(999);
      expect(removed).toBe(false);
    });
  });

  describe("getBestBuy", () => {
    it("should return the highest priced BUY order for a symbol", () => {
      const order1: Order = {
        id: 11,
        userId: "user9",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      const order2: Order = {
        id: 12,
        userId: "user10",
        symbol: "AAPL",
        quantity: 5,
        price: 160,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const bestBuy = orderBook.getBestBuy("AAPL");
      expect(bestBuy).toEqual(order2);
    });

    it("should return null if there are no BUY orders for a symbol", () => {
      expect(orderBook.getBestBuy("GOOG")).toBeNull();
    });
  });

  describe("getBestSell", () => {
    it("should return the lowest priced SELL order for a symbol", () => {
      const order1: Order = {
        id: 13,
        userId: "user11",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(1000)
      };

      const order2: Order = {
        id: 14,
        userId: "user12",
        symbol: "AAPL",
        quantity: 5,
        price: 140,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date(2000)
      };

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const bestSell = orderBook.getBestSell("AAPL");
      expect(bestSell).toEqual(order2);
    });

    it("should return null if there are no SELL orders for a symbol", () => {
      expect(orderBook.getBestSell("GOOG")).toBeNull();
    });
  });

  describe("getBuyOrders and getSellOrders", () => {
    it("should return all orders for a given symbol", () => {
      const buyOrder: Order = {
        id: 15,
        userId: "user13",
        symbol: "AAPL",
        quantity: 10,
        price: 150,
        type: "BUY",
        status: "PENDING",
        createdAt: new Date()
      };

      const sellOrder: Order = {
        id: 16,
        userId: "user14",
        symbol: "AAPL",
        quantity: 5,
        price: 140,
        type: "SELL",
        status: "PENDING",
        createdAt: new Date()
      };

      orderBook.addOrder(buyOrder);
      orderBook.addOrder(sellOrder);

      const buyOrders = orderBook.getBuyOrders("AAPL");
      const sellOrders = orderBook.getSellOrders("AAPL");

      expect(buyOrders).toHaveLength(1);
      expect(buyOrders[0]).toEqual(buyOrder);
      expect(sellOrders).toHaveLength(1);
      expect(sellOrders[0]).toEqual(sellOrder);
    });
  });
});
