"use strict";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  dbPath: process.env.DB_PATH || "./data/orders.db",
  adminUsername: process.env.ADMIN_USERNAME,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  adminToken: process.env.ADMIN_TOKEN,
  jwtSecret: process.env.JWT_SECRET,
  notifications: {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID
    },
    vk: {
      token: process.env.VK_BOT_TOKEN,
      peerId: process.env.VK_PEER_ID
    },
    max: {
      token: process.env.MAX_BOT_TOKEN,
      chatId: process.env.MAX_CHAT_ID
    }
  }
};
