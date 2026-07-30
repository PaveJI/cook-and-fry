"use strict";

const config = require("../config");

// Заготовка для отправки уведомлений в мессенджер Max.
// После получения токена и идентификатора чата реализовать отправку.
// Документацию и endpoint API необходимо уточнить после получения доступа.

function formatOrder(order) {
  return [
    `Новый заказ обеда #${order.order_number}`,
    `Компания: ${order.company_name}`,
    `Дата доставки: ${order.delivery_date}`,
    `Клиент: ${order.customer_name}`,
    `Телефон: ${order.customer_phone}`,
    ``,
    `Состав: ${order.dish1}, ${order.dish2}, ${order.dish3}`,
    `Напиток: ${order.drink || "—"}`,
    `Хлеб: ${order.bread || "—"}`
  ].join("\n");
}

async function notify(order) {
  if (!config.notifications.max.token || !config.notifications.max.chatId) {
    return { provider: "max", sent: false, reason: "not configured" };
  }

  // TODO: реализовать запрос к API мессенджера Max
  // const url = "https://api.max.ru/...";
  // const res = await fetch(url, { ... });

  console.log("[Max notification stub]", formatOrder(order));
  return { provider: "max", sent: false, reason: "not implemented" };
}

module.exports = { notify };
