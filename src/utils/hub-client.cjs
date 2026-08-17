const HUB_URL = process.env.HUB_URL || 'http://127.0.0.1:8600';

async function hubRequest(path, body) {
  const res = await fetch(`${HUB_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data.error || `Hub HTTP ${res.status}`);
  }
  return data;
}

async function notify(level, message) {
  const source = process.env.HUB_SOURCE || process.env.PM2_PROCESS_NAME || 'unknown';
  return hubRequest('/hub/notify', { source, level, message });
}

async function createTask(type, payload) {
  const source = process.env.HUB_SOURCE || process.env.PM2_PROCESS_NAME || 'unknown';
  return hubRequest('/hub/tasks', { source, type, payload });
}

async function listTasks(status, limit = 20) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', String(limit));
  const res = await fetch(`${HUB_URL}/hub/tasks?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Hub HTTP ${res.status}`);
  return data;
}

module.exports = { notify, createTask, listTasks };
