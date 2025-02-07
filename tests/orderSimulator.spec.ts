import { simulateCycle, startOrderBookSimulation } from "../src/matching/orderSimulator";
import { createOrder } from "../src/services/orderService";
import getStockPrice from "../src/matching/priceUpdator";
import logger from "../src/config/logger";

jest.mock("../src/services/orderService", () => ({
  createOrder: jest.fn(),
}));

jest.mock("../src/matching/priceUpdator", () => jest.fn());
jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("simulateCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should skip simulation if no market price is available", async () => {
    (getStockPrice as jest.Mock).mockResolvedValue(null);

    await simulateCycle();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No market price available for NVDA")
    );
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("should create BUY and SELL orders when market price is available", async () => {
    const marketPrice = 100;
    (getStockPrice as jest.Mock).mockResolvedValue(marketPrice);
    const mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    await simulateCycle();

    const expectedBuyQuantity = 11;
    const expectedSellQuantity = 11;
    const expectedBidPrice = 99.58;
    const expectedAskPrice = 100.43;

    expect(createOrder).toHaveBeenCalledTimes(2);
    expect(createOrder).toHaveBeenCalledWith(
      "SIMULATED_TRADER",
      "NVDA",
      expectedBuyQuantity,
      expectedBidPrice,
      "BUY",
    );
    expect(createOrder).toHaveBeenCalledWith(
      "SIMULATED_TRADER",
      "NVDA",
      expectedSellQuantity,
      expectedAskPrice,
      "SELL",
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Simulated order book update for NVDA:")
    );
    mathRandomSpy.mockRestore();
  });
});

describe("startOrderBookSimulation", () => {
  it("should return a timer handle", () => {
    const timer = startOrderBookSimulation();
    expect(timer).toBeDefined();
    clearInterval(timer);
  });
});
