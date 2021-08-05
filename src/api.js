const API_KEY =
  "bc4288a12924e1275c9b01573837e78d32d1827fd3ce12804d5b6210c30b812f";
const tickersHandlers = new Map();
const crossRates = new Map();
let crossRateCurrencyToUsd;
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";
const INVALID_SUB = "500";
const CURRENCY_FOR_CROSSRATES = "BTC";
const MAIN_CURRENCY = "USD";

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    TOSYMBOL: toSymbol,
    PARAMETER: parameter,
  } = JSON.parse(e.data);

  if (type === INVALID_SUB) {
    const matches = parameter.match(/5~CCCAGG~([A-Z]+)~([A-Z]+)/);
    const fromSym = matches[1];
    const toSym = matches[2];
    if (toSym === MAIN_CURRENCY) {
      if (tickersHandlers.get(CURRENCY_FOR_CROSSRATES) === undefined) {
        subscribeToTicker(CURRENCY_FOR_CROSSRATES, (message) => {
          if (message.error) {
            return;
          }
          crossRateCurrencyToUsd = message.price;
          crossRates.forEach((value, currency) => {
            console.log("crossrates ", currency, value, message);
            const handlers = tickersHandlers.get(currency) ?? [];
            handlers.forEach((fn) =>
              fn({ price: value * message.price, error: false })
            );
          });
        });
      }
      subscribeToTickerOnWs(fromSym, CURRENCY_FOR_CROSSRATES);
      return;
    }
    const handlers = tickersHandlers.get(fromSym) ?? [];
    handlers.forEach((fn) => fn({ price: 0, error: true }));
  }

  if (type !== AGGREGATE_INDEX || isNaN(newPrice)) {
    return;
  }

  if (toSymbol === CURRENCY_FOR_CROSSRATES) {
    crossRates.set(currency, newPrice);
    if (!crossRateCurrencyToUsd) {
      return;
    }
  }
  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) =>
    fn({
      price:
        toSymbol === CURRENCY_FOR_CROSSRATES
          ? newPrice * crossRateCurrencyToUsd
          : newPrice,
      error: false,
    })
  );
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker, toCurrency = MAIN_CURRENCY) {
  const message = {
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${toCurrency}`],
  };

  sendToWebSocket(message);
}

function unsubscribeFromTickerOnWs(ticker, currency = MAIN_CURRENCY) {
  const message = {
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~${currency}`],
  };

  sendToWebSocket(message);
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  if (ticker !== CURRENCY_FOR_CROSSRATES || subscribers.length === 0) {
    subscribeToTickerOnWs(ticker);
  }
};

export const unsubscribeFromTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(
    ticker,
    subscribers.filter((fn) => fn != cb)
  );
  if (ticker !== CURRENCY_FOR_CROSSRATES || crossRates.length === 0) {
    unsubscribeFromTickerOnWs(ticker);
  }
};

export const fetchCoins = async () => {
  const f = await fetch(
    `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
  );
  const data = await f.json();
  return Object.keys(data.Data);
};

window.handlers = tickersHandlers;
