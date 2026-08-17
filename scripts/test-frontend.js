"use strict";

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

const HTML_PATH = path.join(__dirname, "../frontend/index.html");

function createDom() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const dom = new JSDOM(html, {
    url: "http://127.0.0.1:3001/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });

  const win = dom.window;

  if (!win.IntersectionObserver) {
    win.IntersectionObserver = class IntersectionObserver {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {}
      disconnect() {}
    };
  }

  if (!win.fetch) {
    win.fetch = global.fetch;
  }

  return { dom, win };
}

let failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    failed++;
  } else {
    console.log("PASS:", message);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("--- Loading page and checking for JS errors ---");
  const { win: win1, dom: dom1 } = createDom();
  const errors = [];
  win1.addEventListener("error", (e) => errors.push({ type: "error", message: e.message, stack: e.error && e.error.stack }));
  const origError = win1.console.error;
  win1.console.error = (...args) => errors.push({ type: "console.error", message: args.join(" ") });

  await wait(600);
  assert(errors.length === 0, `No JS errors on load (got ${errors.length})`);
  if (errors.length) console.error(errors);
  dom1.window.close();

  console.log("\n--- Theme toggle ---");
  const { win: win2, dom: dom2 } = createDom();
  await wait(100);
  const toggle = win2.document.getElementById("theme-toggle");
  assert(toggle !== null, "Theme toggle exists");
  const initialTheme = win2.document.documentElement.getAttribute("data-theme");
  toggle.click();
  const newTheme = win2.document.documentElement.getAttribute("data-theme");
  assert(newTheme !== initialTheme, `Theme changed from ${initialTheme} to ${newTheme}`);
  assert(win2.localStorage.getItem("cf-theme") === newTheme, "Theme persisted to localStorage");
  dom2.window.close();

  console.log("\n--- Mobile menu toggle ---");
  const { win: win3, dom: dom3 } = createDom();
  await wait(100);
  const menuToggle = win3.document.getElementById("menu-toggle");
  const mobileMenu = win3.document.getElementById("mobile-menu");
  assert(menuToggle !== null, "Menu toggle exists");
  assert(mobileMenu !== null, "Mobile menu exists");
  assert(!mobileMenu.classList.contains("open"), "Mobile menu closed initially");
  menuToggle.click();
  assert(mobileMenu.classList.contains("open"), "Mobile menu opened after click");
  dom3.window.close();

  console.log("\n--- Form submission ---");
  const { win: win4, dom: dom4 } = createDom();
  await wait(100);
  const fetchCalls = [];
  win4.fetch = (url, opts) => {
    fetchCalls.push({ url, opts });
    return Promise.resolve({
      json: () => Promise.resolve({ success: true, order: { order_number: "LUNCH-20260730-0001" } })
    });
  };
  const form = win4.document.getElementById("orderForm");
  form.elements.customer_name.value = "Иван";
  form.elements.customer_phone.value = "+79990000000";
  form.elements.delivery_date.value = "2026-07-30";
  form.elements.dish1.value = "Борщ";
  form.elements.dish2.value = "Котлета";
  form.elements.dish3.value = "Салат";
  form.dispatchEvent(new win4.Event("submit", { bubbles: true, cancelable: true }));
  await wait(300);
  const orderCall = fetchCalls.find(c => c.url === "/api/orders");
  assert(orderCall !== undefined, "Form POSTs to /api/orders");
  if (orderCall) {
    const body = JSON.parse(orderCall.opts.body);
    assert(body.customer_name === "Иван", "Form body contains customer name");
    assert(body.company_name === "На обед в буфет", "Form body contains company name");
  }
  dom4.window.close();

  console.log("\n--- Summary ---");
  if (failed > 0) {
    console.error(`${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("All checks passed");
}

run().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
