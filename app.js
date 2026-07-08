const DATA_URL = "data/guest_lookup.csv";

const form = document.querySelector("#lookup-form");
const input = document.querySelector("#last-name");
const result = document.querySelector("#result");
const closingMessage = document.querySelector("#closing-message");

let lookupData = new Map();
let isDataReady = false;

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function showMessage(message, type = "neutral") {
  result.textContent = message;
  result.className = `result ${type}`;
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`);

    if (!response.ok) {
      throw new Error("data file not found");
    }

    const csvText = await response.text();
    const rows = parseCsv(csvText).filter((row) =>
      row.some((cell) => String(cell).trim() !== "")
    );

    const dataRows =
      rows[0]?.[0]?.trim() === "key" && rows[0]?.[1]?.trim() === "value"
        ? rows.slice(1)
        : rows;

    lookupData = new Map();

    dataRows.forEach((row) => {
      const key = normalizeKey(row[0]);
      const value = String(row[1] ?? "").trim();

      if (key && !lookupData.has(key)) {
        lookupData.set(key, value);
      }
    });

    isDataReady = lookupData.size > 0;

    if (!isDataReady) {
      showMessage("受付準備中です。", "neutral");
    }
  } catch (error) {
    isDataReady = false;
    showMessage("受付準備中です。", "neutral");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  closingMessage.hidden = true;

  if (!isDataReady) {
    showMessage("受付準備中です。", "neutral");
    return;
  }

  const key = normalizeKey(input.value);

  if (!key) {
    showMessage("苗字を入力してください。", "warning");
    input.focus();
    return;
  }

  if (!lookupData.has(key)) {
    showMessage("該当する情報が見つかりませんでした。", "warning");
    return;
  }

  const message = lookupData.get(key);
  showMessage(message || "表示する内容が空です。", "success");
  closingMessage.hidden = false;
});

loadData();
