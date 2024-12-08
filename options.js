// options.js

document.getElementById("saveBtn").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const baseId = document.getElementById("baseId").value.trim();
  const tableName = document.getElementById("tableName").value.trim();

  if (!apiKey || !baseId || !tableName) {
    updateStatus("All fields are required.", "error");
    return;
  }

  chrome.storage.sync.set({ apiKey, baseId, tableName }, () => {
    updateStatus("Settings saved successfully.", "success");
  });
});

/**
 * Updates the status message in the options page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success' or 'error').
 */
function updateStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.style.color = type === "success" ? "green" : "red";
}

// Load existing settings on page load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["apiKey", "baseId", "tableName"], (result) => {
    if (result.apiKey) {
      document.getElementById("apiKey").value = result.apiKey;
    }
    if (result.baseId) {
      document.getElementById("baseId").value = result.baseId;
    }
    if (result.tableName) {
      document.getElementById("tableName").value = result.tableName;
    }
  });
});
