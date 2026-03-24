const defaultRates = {
  ZAR: 1,
  USD: 0.055,
  GBP: 0.043,
  EUR: 0.051
};

function convertCurrency(amount, from = "ZAR", to = "ZAR") {
  if (from === to) {
    return amount;
  }

  const inZar = from === "ZAR" ? amount : amount / (defaultRates[from] || 1);
  return Number((inZar * (defaultRates[to] || 1)).toFixed(2));
}

module.exports = { convertCurrency };
