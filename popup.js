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

// ====================
// Imgur Configuration
// ====================

// ⚠️ Replace with your actual Imgur Client ID.
//       Consider storing this securely using Chrome's storage API.
const IMGUR_CLIENT_ID = "564e570fd2747d5"; // e.g., "Client-ID xxxxxxxxxxxxxxx"

/**
 * Converts a Blob to a Base64 string.
 * @param {Blob} blob - The image Blob.
 * @returns {Promise<string>} - A promise that resolves to the Base64 string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove data URL prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads an image to Imgur and returns the public URL.
 * @param {string} imageUrl - The original image URL from EasyCars.
 * @returns {Promise<string|null>} - The public URL of the uploaded image or null if failed.
 */
async function uploadImageToImgur(imageUrl) {
  try {
    // Fetch the image data with credentials if needed
    const response = await fetch(imageUrl, {
      credentials: "include", // Include cookies for authentication if necessary
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`, response.statusText);
      return null;
    }

    const blob = await response.blob();
    const base64Image = await blobToBase64(blob);

    // Prepare the payload for Imgur
    const formData = new FormData();
    formData.append("image", base64Image);

    // Upload to Imgur
    const imgurResponse = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    const imgurResult = await imgurResponse.json();

    if (imgurResult.success) {
      console.log(`Image uploaded to Imgur: ${imgurResult.data.link}`);
      return imgurResult.data.link;
    } else {
      console.error("Imgur upload failed:", imgurResult);
      return null;
    }
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    return null;
  }
}

/**
 * Extracts value from an input field.
 * @param {HTMLElement} formGroup - The form-group div containing the label and input.
 * @returns {string} - The input value or 'N/A' if not found.
 */
function extractInputValue(formGroup) {
  const input = formGroup.querySelector("input");
  if (input && input.value) {
    const value = input.value.trim();
    console.log(`EasyCars Data Extractor: Extracted input value "${value}".`);
    return value;
  }
  console.warn(`EasyCars Data Extractor: Input field not found or empty.`);
  return "N/A";
}

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
let extractedPhotos = []; // To store extracted photo URLs

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
          displayData(extractedData);
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

document.getElementById("extractPhotosBtn").addEventListener("click", () => {
  console.group("Extract Photos Process");
  console.log("Initiating photo extraction...");

  // Query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) {
      console.error("No active tab found.");
      updateStatus("Error: No active tab found.", "error");
      console.groupEnd();
      return;
    }

    // Send a message to the content script to extract photos
    chrome.tabs.sendMessage(
      activeTab.id,
      { action: "extractPhotos" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime Error:", chrome.runtime.lastError.message);
          updateStatus("Error: " + chrome.runtime.lastError.message, "error");
          console.groupEnd();
          return;
        }

        if (response && response.photos) {
          extractedPhotos = response.photos; // Store the photo URLs
          console.log("Photos extracted successfully:", extractedPhotos);
          displayPhotos(extractedPhotos);
          document.getElementById("postBtn").disabled = false; // Enable post button
          updateStatus("Photos extracted successfully.", "success");
        } else {
          console.warn("No photos received from content script.");
          updateStatus("No photos found.", "error");
          // Optionally, you can disable the post button if photos are essential
          // document.getElementById("postBtn").disabled = true;
        }
        console.groupEnd();
      }
    );
  });
});

document.getElementById("postBtn").addEventListener("click", async () => {
  console.group("Post to Airtable Process");
  console.log("Initiating post to Airtable...");

  if (!extractedData) {
    console.error("No data to post. Extraction required first.");
    updateStatus("No data to post. Please extract data first.", "error");
    console.groupEnd();
    return;
  }

  if (extractedPhotos.length === 0) {
    console.warn("No photos to post. Proceeding without images.");
    // Depending on requirements, you can choose to block posting without photos
    // Uncomment the lines below to block posting
    // updateStatus("No photos to post. Please extract photos first.", "error");
    // console.groupEnd();
    // return;
  }

  // Disable the post button to prevent multiple clicks
  const postBtn = document.getElementById("postBtn");
  postBtn.disabled = true;
  postBtn.textContent = "Posting...";

  // Upload photos to Imgur and collect public URLs
  const publicPhotoUrls = [];
  for (let i = 0; i < extractedPhotos.length; i++) {
    const photoUrl = extractedPhotos[i];
    console.log(
      `Uploading photo ${i + 1}/${extractedPhotos.length}: ${photoUrl}`
    );
    const publicUrl = await uploadImageToImgur(photoUrl);
    if (publicUrl) {
      publicPhotoUrls.push(publicUrl);
    } else {
      console.warn(`Failed to upload photo: ${photoUrl}`);
    }
  }

  // Prepare data for Airtable
  const airtableData = {
    fields: mapDataToAirtableFields(extractedData, publicPhotoUrls),
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

      // Re-enable the post button after processing
      postBtn.disabled = false;
      postBtn.textContent = "Post to Airtable";
    })
    .catch((error) => {
      console.error("Network or Unexpected Error:", error);
      updateStatus("Error posting to Airtable.", "error");
      console.groupEnd();

      // Re-enable the post button after error
      postBtn.disabled = false;
      postBtn.textContent = "Post to Airtable";
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
 * Maps the extracted data and photos to Airtable's expected field structure.
 * Modify this function based on your Airtable base's schema.
 * @param {Object} data - The extracted vehicle data.
 * @param {Array<string>} photos - The array of public photo URLs.
 * @returns {Object} - The mapped data.
 */
function mapDataToAirtableFields(data, photos) {
  console.log("Mapping data and photos to Airtable fields...");

  // Map vehicle data fields
  const mappedData = {
    // Add or modify field mappings based on your Airtable schema
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
    Features: data["Features"], // Added Features field
    // Add more mappings as needed
    // For example:
    // "Registration No": data["Registration No"],
    // "Registration Expiry": data["Registration Expiry"],
    // ...etc.
  };

  // Map photos to Airtable attachment format
  if (photos && photos.length > 0) {
    mappedData.Image = photos.map((url) => ({ url })); // Ensure 'Image' matches your Airtable field name
    console.log("Mapped Image for Airtable:", mappedData.Image);
  } else {
    console.warn("No photos to map to Airtable.");
  }

  return mappedData;
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
 * Displays the extracted vehicle data in the popup.
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
    valueSpan.textContent = value || "N/A";

    fieldDiv.appendChild(labelSpan);
    fieldDiv.appendChild(valueSpan);
    dataDiv.appendChild(fieldDiv);
  }

  // Optional: Add copy to clipboard or download functionality here
}

/**
 * Displays the extracted photos in the popup with removal functionality.
 * @param {Array<string>} photos - The array of photo URLs.
 */
function displayPhotos(photos) {
  console.log("Displaying extracted photos in popup...");
  const dataDiv = document.getElementById("data");

  // Remove existing photos container if any
  const existingPhotosContainer = dataDiv.querySelector(".photos-container");
  if (existingPhotosContainer) {
    dataDiv.removeChild(existingPhotosContainer);
  }

  // Create a container for photos
  const photosContainer = document.createElement("div");
  photosContainer.className = "field photos-container";

  const labelSpan = document.createElement("span");
  labelSpan.className = "label";
  labelSpan.textContent = "Photos: ";

  const imagesDiv = document.createElement("div");
  imagesDiv.className = "photos";

  if (photos.length > 0) {
    photos.forEach((url) => {
      const photoItem = document.createElement("div");
      photoItem.className = "photo-item";
      photoItem.style.display = "inline-block";
      photoItem.style.position = "relative";
      photoItem.style.margin = "5px";

      const img = document.createElement("img");
      img.src = url;
      img.alt = "Vehicle Photo";
      img.style.maxWidth = "100px"; // Adjust as needed
      img.style.display = "block";

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "X";
      removeBtn.className = "remove-photo-button";
      removeBtn.style.position = "absolute";
      removeBtn.style.top = "0px";
      removeBtn.style.right = "0px";
      removeBtn.style.backgroundColor = "red";
      removeBtn.style.color = "white";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "50%";
      removeBtn.style.width = "20px";
      removeBtn.style.height = "20px";
      removeBtn.style.cursor = "pointer";
      removeBtn.title = "Remove photo";

      // Add event listener to remove the photo
      removeBtn.addEventListener("click", () => {
        console.log(`Removing photo: ${url}`);
        // Remove from extractedPhotos
        const photoIndex = extractedPhotos.indexOf(url);
        if (photoIndex > -1) {
          extractedPhotos.splice(photoIndex, 1);
          // Refresh the photos display
          displayPhotos(extractedPhotos);
        }
      });

      photoItem.appendChild(img);
      photoItem.appendChild(removeBtn);
      imagesDiv.appendChild(photoItem);
    });
  } else {
    imagesDiv.textContent = "No photos available.";
  }

  photosContainer.appendChild(labelSpan);
  photosContainer.appendChild(imagesDiv);
  dataDiv.appendChild(photosContainer);
}
