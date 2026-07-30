"use strict";

require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");

describe("Lunch Orders API", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /api/orders creates lunch order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        company_name: "ООО Ромашка",
        delivery_date: "2026-07-30",
        customer_name: "Иван",
        customer_phone: "+79990000000",
        dish1: "Борщ",
        dish2: "Котлета с пюре",
        dish3: "Салат овощной",
        drink: "Компот",
        bread: "Багет"
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.order_number).toMatch(/^LUNCH-\d{8}-\d{4}$/);
    expect(res.body.order.dish1).toBe("Борщ");
  });

  it("POST /api/orders validates required fields", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ customer_name: "Иван" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("GET /api/orders/:id returns order", async () => {
    const createRes = await request(app)
      .post("/api/orders")
      .send({
        company_name: "ООО Лютик",
        delivery_date: "2026-07-31",
        customer_name: "Пётр",
        customer_phone: "+79991112233",
        dish1: "Суп",
        dish2: "Паста",
        dish3: "Овощи на гриле"
      });
    const orderId = createRes.body.order.id;

    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.order.customer_name).toBe("Пётр");
  });

  it("GET /api/admin/orders requires admin token", async () => {
    const res = await request(app).get("/api/admin/orders");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/orders returns orders with token", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("X-Admin-Token", process.env.ADMIN_TOKEN || "test-admin-token");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
});
