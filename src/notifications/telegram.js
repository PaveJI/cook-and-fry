"use strict";

const { notify: hubNotify } = require("../utils/hub-client.cjs");

function formatOrder(order) {
  return [
    `🍽 Новый заказ обеда #${order.order_number}`,
    `🏢 Компания: ${order.company_name}`,
    `📅 Дата доставки: ${order.delivery_date}`,
    `👤 ${order.customer_name}`,
    `📞 ${order.customer_phone}`,
    `📧 ${order.customer_email || "—"}`,
    ``,
    `Блюдо 1: ${order.dish1}`,
    `Блюдо 2: ${order.dish2}`,
    `Блюдо 3: ${order.dish3}`,
    `Напиток: ${order.drink || "—"}`,
    `Хлеб: ${order.bread || "—"}`,
    ``,
    `Комментарий: ${order.comment || "—"}`
  ].join("\n");
}

async function notify(order) {
  try {
    await hubNotify("info", formatOrder(order));
    return { provider: "hub", sent: true };
  } catch (err) {
    console.error("Hub notification failed:", err.message);
    return { provider: "hub", sent: false, error: err.message };
  }
}

module.exports = { notify };
