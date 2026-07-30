"use strict";

const config = require("../config");

// Заготовка для отправки уведомлений в VK.
// После получения токена и peer_id реализовать отправку через VK API.
// Документация: https://dev.vk.com/method/messages.send

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
  if (!config.notifications.vk.token || !config.notifications.vk.peerId) {
    return { provider: "vk", sent: false, reason: "not configured" };
  }

  // TODO: реализовать запрос к VK API
  // const url = `https://api.vk.com/method/messages.send`;
  // const params = new URLSearchParams({
  //   access_token: config.notifications.vk.token,
  //   peer_id: config.notifications.vk.peerId,
  //   message: formatOrder(order),
  //   v: "5.199"
  // });
  // const res = await fetch(url, { method: "POST", body: params });

  console.log("[VK notification stub]", formatOrder(order));
  return { provider: "vk", sent: false, reason: "not implemented" };
}

module.exports = { notify };
