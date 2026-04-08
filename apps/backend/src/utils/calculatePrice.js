const calculatePrice = (basePrice, markup) => {
  return Math.ceil(basePrice + (basePrice * markup) / 100);
};

module.exports = calculatePrice;