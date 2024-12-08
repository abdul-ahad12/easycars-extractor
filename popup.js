// popup.js

// ====================
// Airtable Configuration
// ====================

// ⚠️ Replace these values with your actual Airtable credentials.
//       Be cautious: Hard-coding sensitive information is insecure.
const AIRTABLE_API_KEY =
  "patgEDvLnS4cTYdSl.56e211bef10ef4d5851d982037a042da25efcaeffe896f040552a28e12d200f7"; // e.g., "keyABC123..."
const BASE_ID = "appjaP7q4IDvEunlC"; // e.g., "appXYZ789..."
const TABLE_NAME = "tblZ0PIvXP7itCHyf"; // e.g., "Vehicles"

/**
 * Example:
 * const AIRTABLE_API_KEY = "keyABC123...";
 * const BASE_ID = "appXYZ789...";
 * const TABLE_NAME = "Vehicles";
 */

// ====================
// Main Functionality
// ====================

let extractedData = null; // To store extracted data

document.getElementById("extractBtn").addEventListener("click", () => {
  console.group("Extract Data Process");
  console.log("Initiating data extraction...");

  // Query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) {
      console.error("No active tab found.");
      updateStatus("Error: No active tab found.", "error");
      console.groupEnd();
      return;
    }

    // Send a message to the content script to extract data
    chrome.tabs.sendMessage(
      activeTab.id,
      { action: "extractData" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime Error:", chrome.runtime.lastError.message);
          updateStatus("Error: " + chrome.runtime.lastError.message, "error");
          console.groupEnd();
          return;
        }

        if (response && response.data) {
          extractedData = response.data; // Store the data
          console.log("Data extracted successfully:", extractedData);
          displayData(response.data);
          document.getElementById("postBtn").disabled = false; // Enable post button
          updateStatus("Data extracted successfully.", "success");
        } else {
          console.warn("No data received from content script.");
          updateStatus("No data found.", "error");
          document.getElementById("postBtn").disabled = true;
        }
        console.groupEnd();
      }
    );
  });
});

document.getElementById("postBtn").addEventListener("click", () => {
  console.group("Post to Airtable Process");
  console.log("Initiating post to Airtable...");

  if (!extractedData) {
    console.error("No data to post. Extraction required first.");
    updateStatus("No data to post. Please extract data first.", "error");
    console.groupEnd();
    return;
  }

  // Prepare data for Airtable
  const airtableData = {
    fields: mapDataToAirtableFields(extractedData),
  };
  console.log("Mapped Airtable Data:", airtableData);

  // Make the POST request to Airtable
  postToAirtable(airtableData)
    .then((response) => {
      if (response.success) {
        console.log("Data posted to Airtable successfully:", response.data);
        updateStatus("Data posted to Airtable successfully!", "success");
      } else {
        console.error("Airtable Error:", response.error);
        updateStatus(
          "Error posting to Airtable: " + JSON.stringify(response.error),
          "error"
        );
      }
      console.groupEnd();
    })
    .catch((error) => {
      console.error("Network or Unexpected Error:", error);
      updateStatus("Error posting to Airtable.", "error");
      console.groupEnd();
    });
});

/**
 * Updates the status message in the popup.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success' or 'error').
 */
function updateStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.style.color = type === "success" ? "green" : "red";
}

/**
 * Maps the extracted data to Airtable's expected field structure.
 * Modify this function based on your Airtable base's schema.
 * @param {Object} data - The extracted vehicle data.
 * @returns {Object} - The mapped data.
 */
function mapDataToAirtableFields(data) {
  console.log("Mapping data to Airtable fields...");
  return {
    // "Entry Number": data["Entry Number"],
    Year: data["Year"],
    Make: data["Make"],
    Model: data["Model"],
    "Body Style": data["Body Style"],
    Condition: data["Condition"],
    Transmission: data["Transmission"],
    Colour: data["Colour"],
    "Fuel Type": data["Fuel Type"],
    "Stock Number": data["Stock Number"],
    "VIN Number": data["VIN Number"],
    "Kilometers Driven": data["Kilometers Driven"],
    // Chassis: data["Chassis"],
    // "Registration No": data["Registration No"],
    // "Registration Expiry": data["Registration Expiry"],
    // "Registration State": data["Registration State"],
    // "CTP Insurer": data["CTP Insurer"],
    // "Registered To": data["Registered To"],
    // "Initial Registration Date": data["Initial Registration Date"],
    // "Rego Check Digit": data["Rego Check Digit"],
    // "Previous Registration": data["Previous Registration"],
    // "Stock Type": data["Stock Type"],
    // Series: data["Series"],
    // Badge: data["Badge"],
    // "Redbook Description": data["Redbook Description"],
    // "Interior Colour": data["Interior Colour"],
    // "Build Date": data["Build Date"],
    // "Compliance/RAV Entry Date": data["Compliance/RAV Entry Date"],
    // "Engine Number": data["Engine Number"],
    // "KMs/Miles": data["KMs/Miles"],
    // "Green Vehicle Rating": data["Green Vehicle Rating"],
    // "Fuel Efficient LCT": data["Fuel Efficient LCT"],
    // Location: data["Location"],
    // "Is Commercial Vehicle": data["Is Commercial Vehicle"],
    // "Stock Group": data["Stock Group"],
    // Add more mappings as needed
  };
}

/**
 * Makes a POST request to Airtable to add a new record.
 * @param {Object} data - The data to send to Airtable.
 * @returns {Promise<Object>} - The response from Airtable.
 */
async function postToAirtable(data) {
  console.log("Posting data to Airtable...");

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    TABLE_NAME
  )}`;

  console.log("Airtable API URL:", url);
  console.log("Airtable Data Payload:", data);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("EasyCars Data Extractor: Data posted to Airtable:", result);
      return { success: true, data: result };
    } else {
      console.error("EasyCars Data Extractor: Airtable Error:", result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error("EasyCars Data Extractor: Network Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Displays the extracted data in the popup.
 * @param {Object} data - The vehicle data extracted from the page.
 */
function displayData(data) {
  console.log("Displaying extracted data in popup...");
  const dataDiv = document.getElementById("data");
  dataDiv.innerHTML = ""; // Clear previous data

  for (const [key, value] of Object.entries(data)) {
    const fieldDiv = document.createElement("div");
    fieldDiv.className = "field";

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = `${key}: `;

    const valueSpan = document.createElement("span");

    if (key === "Photos" && Array.isArray(value)) {
      // Create a container for photos
      const photosContainer = document.createElement("div");
      photosContainer.className = "photos";

      if (value.length > 0) {
        value.forEach((src) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = "Vehicle Photo";
          photosContainer.appendChild(img);
        });
      } else {
        photosContainer.textContent = "No photos available.";
      }

      valueSpan.appendChild(photosContainer);
    } else {
      valueSpan.textContent = value || "N/A";
    }

    fieldDiv.appendChild(labelSpan);
    fieldDiv.appendChild(valueSpan);
    dataDiv.appendChild(fieldDiv);
  }

  // Optional: Add copy to clipboard or download functionality here
}
