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

function formatLead(lead) {
  return [
    `Новая заявка с лендинга`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Компания: ${lead.company || "—"}`,
    `Источник: ${lead.source || "landing"}`
  ].join("\n");
}

async function notify(order) {
  if (!config.notifications.vk.token || !config.notifications.vk.peerId) {
    return { provider: "vk", sent: false, reason: "not configured" };
  }

  // TODO: реализовать запрос к VK API для заказов
  console.log("[VK notification stub]", formatOrder(order));
  return { provider: "vk", sent: false, reason: "not implemented" };
}

async function notifyLead(lead) {
  const { token, peerId } = config.notifications.vk;
  if (!token || !peerId) {
    return { provider: "vk", sent: false, reason: "not configured" };
  }

  try {
    const params = new URLSearchParams({
      access_token: token,
      peer_id: peerId,
      message: formatLead(lead),
      random_id: String(Date.now()),
      v: "5.199"
    });
    const res = await fetch("https://api.vk.com/method/messages.send", {
      method: "POST",
      body: params
    });
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.error_msg);
    }
    return { provider: "vk", sent: true };
  } catch (err) {
    console.error("VK lead notification failed:", err.message);
    return { provider: "vk", sent: false, error: err.message };
  }
}

module.exports = { notify, notifyLead };
