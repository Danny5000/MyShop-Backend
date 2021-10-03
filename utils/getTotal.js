function getTotal(cart) {
  let totalPrice = 0.0;

  for (let i = 0; i < cart.length; i++) {
    totalPrice += cart[i].total;
  }

  return totalPrice;
}

module.exports = getTotal;
