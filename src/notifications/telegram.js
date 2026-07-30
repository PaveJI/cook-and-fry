"use strict";

const TelegramBot = require("node-telegram-bot-api");
const config = require("../config");

const bot = config.notifications.telegram.botToken
  ? new TelegramBot(config.notifications.telegram.botToken, { polling: false })
  : null;

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
  if (!bot || !config.notifications.telegram.adminChatId) {
    return { provider: "telegram", sent: false, reason: "not configured" };
  }

  try {
    await bot.sendMessage(config.notifications.telegram.adminChatId, formatOrder(order));
    return { provider: "telegram", sent: true };
  } catch (err) {
    console.error("Telegram notification failed:", err.message);
    return { provider: "telegram", sent: false, error: err.message };
  }
}

module.exports = { notify };
