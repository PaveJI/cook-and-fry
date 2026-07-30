"use strict";

const telegram = require("./telegram");
const vk = require("./vk");
const max = require("./max");

const providers = [telegram, vk, max];

async function notifyNewOrder(order) {
  const results = await Promise.all(providers.map((provider) => provider.notify(order)));

  const sent = results.filter((r) => r.sent);
  const failed = results.filter((r) => !r.sent);

  if (sent.length === 0 && failed.length > 0) {
    console.log("No notifications were sent:", failed.map((r) => `${r.provider}: ${r.reason || r.error}`).join("; "));
  }

  return results;
}

module.exports = { notifyNewOrder };
