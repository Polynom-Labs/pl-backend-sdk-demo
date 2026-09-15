const flash = document.getElementById("flash");
const accountsBody = document.getElementById("accounts");
const logsEl = document.getElementById("logs");
const logsPageEl = document.getElementById("logs-page");
const logsPrev = document.getElementById("logs-prev");
const logsNext = document.getElementById("logs-next");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const LOG_PAGE_SIZE = 20;
const busyButtons = new Set();
let logPage = 1;
let logRefreshSeq = 0;
let lastStatus = "stopped";

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || response.statusText);
  }
  return body;
}

function showError(error) {
  flash.hidden = false;
  flash.textContent = error instanceof Error ? error.message : String(error);
}

function clearError() {
  flash.hidden = true;
  flash.textContent = "";
}

function setButtonBusy(button, isBusy) {
  if (isBusy) {
    busyButtons.add(button);
    button.disabled = true;
    button.classList.add("is-busy");
    return;
  }
  busyButtons.delete(button);
  button.classList.remove("is-busy");
}

function syncSimulatorButtons() {
  const running = lastStatus === "running";
  if (!busyButtons.has(startBtn)) {
    startBtn.disabled = running;
  }
  if (!busyButtons.has(stopBtn)) {
    stopBtn.disabled = !running;
  }
}

async function withBusy(button, action) {
  clearError();
  setButtonBusy(button, true);
  try {
    await action();
  } catch (error) {
    showError(error);
  } finally {
    setButtonBusy(button, false);
    syncSimulatorButtons();
  }
}

function formatAccountIndex(index) {
  if (index === null || index === undefined) {
    return "";
  }
  return `#${index}`;
}

function formatLogParties(entry) {
  const from = formatAccountIndex(entry.fromIndex);
  const to = formatAccountIndex(entry.toIndex);
  if (from && to) {
    return `${from} → ${to}`;
  }
  return from || to;
}

function formatLogLine(entry) {
  const parties = formatLogParties(entry);
  const tx = entry.txId ? ` ${entry.txId}` : "";
  const error = entry.error ? ` — ${entry.error}` : "";
  const partiesPart = parties ? ` ${parties}` : "";
  return `${entry.at} [${entry.kind}]${partiesPart} ${entry.message}${tx}${error}`;
}

function renderLogs(logs) {
  logPage = logs.page;
  logsPageEl.textContent = `Page ${logs.page} of ${logs.pageCount} (${logs.total})`;
  logsPrev.disabled = logs.page <= 1;
  logsNext.disabled = logs.page >= logs.pageCount;
  logsEl.innerHTML = "";
  for (const entry of logs.items) {
    const item = document.createElement("li");
    item.textContent = formatLogLine(entry);
    logsEl.appendChild(item);
  }
}

function render(state) {
  lastStatus = state.status;
  document.getElementById("status").textContent = state.status;
  document.getElementById("tx-count").textContent = state.transactionCount;
  document.getElementById("volume").textContent = state.totalVolumeXlm;
  accountsBody.innerHTML = "";
  for (const account of state.accounts) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${account.index}</td>
      <td>${account.publicKey}</td>
      <td>${account.privateBalanceXlm}</td>
      <td>${account.sentCount}</td>
      <td>${account.sentVolumeXlm}</td>
      <td>${account.funded ? "funded" : ""} ${account.registered ? "registered" : ""}</td>
    `;
    accountsBody.appendChild(row);
  }
  renderLogs(state.logs);
  syncSimulatorButtons();
}

async function refresh() {
  const requestedPage = logPage;
  const seq = ++logRefreshSeq;
  const state = await api(
    `/api/state?logPage=${requestedPage}&logLimit=${LOG_PAGE_SIZE}`,
  );
  if (seq !== logRefreshSeq) {
    return;
  }
  render(state);
}

document.getElementById("setup").onclick = () =>
  withBusy(document.getElementById("setup"), async () => {
    await api("/api/setup", { method: "POST", body: "{}" });
    await refresh();
  });

document.getElementById("deposit").onclick = () =>
  withBusy(document.getElementById("deposit"), async () => {
    const amountXlm = Number(document.getElementById("deposit-amount").value);
    await api("/api/deposit", {
      method: "POST",
      body: JSON.stringify({ amountXlm }),
    });
    await refresh();
  });

startBtn.onclick = () =>
  withBusy(startBtn, async () => {
    const amountXlm = Number(document.getElementById("tx-amount").value);
    const transactionsPerMinute = Number(document.getElementById("tpm").value);
    await api("/api/simulator/start", {
      method: "POST",
      body: JSON.stringify({ amountXlm, transactionsPerMinute }),
    });
    await refresh();
  });

stopBtn.onclick = () =>
  withBusy(stopBtn, async () => {
    await api("/api/simulator/stop", { method: "POST", body: "{}" });
    await refresh();
  });

document.getElementById("withdraw").onclick = () =>
  withBusy(document.getElementById("withdraw"), async () => {
    const accountIndex = Number(
      document.getElementById("withdraw-index").value,
    );
    const amountXlm = Number(document.getElementById("withdraw-amount").value);
    await api("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({ accountIndex, amountXlm }),
    });
    await refresh();
  });

logsPrev.onclick = async () => {
  if (logPage <= 1) {
    return;
  }
  logPage -= 1;
  try {
    await refresh();
  } catch (error) {
    showError(error);
  }
};

logsNext.onclick = async () => {
  logPage += 1;
  try {
    await refresh();
  } catch (error) {
    showError(error);
  }
};

refresh().catch(showError);
setInterval(() => {
  refresh().catch(() => undefined);
}, 1000);
