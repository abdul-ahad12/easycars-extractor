// content.js

// Log when the content script is loaded
console.log("EasyCars Data Extractor: Content script loaded.");

// =====================
// Configuration
// =====================

const BASE_URL = "https://my.easycars.net.au"; // Base URL to prepend to image paths

/**
 * Utility function to find a form-group div by label text.
 * @param {string} labelText - The exact text of the label to search for.
 * @returns {HTMLElement|null} - The form-group div element or null if not found.
 */
function findFormGroup(labelText) {
  const labels = document.querySelectorAll("label.control-label");
  for (let label of labels) {
    if (label.textContent.trim() === labelText) {
      const formGroup = label.closest(".form-group");
      if (formGroup) {
        return formGroup;
      } else {
        console.warn(
          `EasyCars Data Extractor: No parent form-group found for label "${labelText}".`
        );
      }
    }
  }
  console.warn(
    `EasyCars Data Extractor: Label "${labelText}" not found on the page.`
  );
  return null;
}

/**
 * Extracts value from a Kendo UI dropdown by accessing the hidden input.
 * @param {HTMLElement} formGroup - The form-group div containing the label and dropdown.
 * @returns {string} - The selected value or 'N/A' if not found.
 */
function extractDropdownValue(formGroup) {
  const hiddenInput = formGroup.querySelector("input[type='text']");
  if (hiddenInput) {
    const value = hiddenInput.value.trim();
    console.log(
      `EasyCars Data Extractor: Extracted dropdown value "${value}".`
    );
    return value || "N/A";
  }
  console.warn(`EasyCars Data Extractor: Kendo UI dropdown input not found.`);
  return "N/A";
}

/**
 * Extracts text content from a span within a form-group.
 * @param {HTMLElement} formGroup - The form-group div containing the label and value.
 * @returns {string} - The extracted text or 'N/A' if not found.
 */
function extractSpanValue(formGroup) {
  const span = formGroup.querySelector("span.span-push-down.ng-binding");
  if (span) {
    const value = span.textContent.trim();
    console.log(
      `EasyCars Data Extractor: Extracted value "${value}" from span.`
    );
    return value || "N/A";
  }
  console.warn(`EasyCars Data Extractor: span-push-down ng-binding not found.`);
  return "N/A";
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
 * Extracts value from a checkbox field.
 * @param {HTMLElement} formGroup - The form-group div containing the label and checkbox.
 * @returns {string} - 'Yes' if checked, 'No' otherwise.
 */
function extractCheckboxValue(formGroup) {
  const checkbox = formGroup.querySelector('input[type="checkbox"]');
  if (checkbox) {
    const value = checkbox.checked ? "Yes" : "No";
    console.log(
      `EasyCars Data Extractor: Extracted checkbox value "${value}".`
    );
    return value;
  }
  console.warn(`EasyCars Data Extractor: Checkbox input not found.`);
  return "N/A";
}

/**
 * Extracts value from a radio button group.
 * @param {HTMLElement} formGroup - The form-group div containing the label and radio buttons.
 * @returns {string} - The selected radio button value or 'N/A' if none selected.
 */
function extractRadioValue(formGroup) {
  const radios = formGroup.querySelectorAll('input[type="radio"]');
  for (let radio of radios) {
    if (radio.checked) {
      const value = radio.nextElementSibling.textContent.trim();
      console.log(
        `EasyCars Data Extractor: Extracted radio button value "${value}".`
      );
      return value;
    }
  }
  console.warn(`EasyCars Data Extractor: No radio button selected.`);
  return "N/A";
}

/**
 * Extracts the first 5 features from the Features list.
 * @returns {string} - A comma-separated string of the first 5 features or 'N/A' if not found.
 */
function extractFeatures() {
  const featuresContainer = document.querySelector(".stock-opts-list");
  if (featuresContainer) {
    const featureItems = featuresContainer.querySelectorAll(
      "li.ng-scope span.ng-binding"
    );
    if (featureItems.length === 0) {
      console.warn("EasyCars Data Extractor: No features found.");
      return "N/A";
    }

    // Extract text from the first 5 features
    const features = [];
    for (let i = 0; i < Math.min(5, featureItems.length); i++) {
      const featureText = featureItems[i].textContent.trim();
      if (featureText) {
        features.push(featureText);
        console.log(
          `EasyCars Data Extractor: Extracted feature "${featureText}".`
        );
      }
    }

    if (features.length === 0) {
      console.warn("EasyCars Data Extractor: No valid features extracted.");
      return "N/A";
    }

    const featuresString = features.join(", ");
    console.log(`EasyCars Data Extractor: Features - "${featuresString}".`);
    return featuresString;
  }
  console.warn("EasyCars Data Extractor: Features container not found.");
  return "N/A";
}

/**
 * Extracts all required vehicle data fields.
 * @returns {Object} - An object containing the extracted vehicle data.
 */
function extractVehicleData() {
  const data = {
    "Stock Number": "N/A",
    "Entry Number": "N/A",
    Yard: "N/A",
    "Used/New": "N/A",
    "Is Demo": "N/A",
    "Registration No": "N/A",
    "Registration Expiry": "N/A",
    "Registration State": "N/A",
    "CTP Insurer": "N/A",
    "Registered To": "N/A",
    "Initial Registration Date": "N/A",
    "Rego Check Digit": "N/A",
    "Previous Registration": "N/A",
    "Stock Type": "N/A",
    Make: "N/A",
    Model: "N/A",
    Year: "N/A",
    Series: "N/A",
    Badge: "N/A",
    "Body Style": "N/A",
    "Redbook Description": "N/A",
    Colour: "N/A",
    "Interior Colour": "N/A",
    "Build Date": "N/A",
    "Compliance/RAV Entry Date": "N/A",
    "Engine Number": "N/A",
    "VIN Number": "N/A",
    Chassis: "N/A",
    "Kilometers Driven": "N/A",
    "KMs/Miles": "N/A",
    "Green Vehicle Rating": "N/A",
    "Fuel Efficient LCT": "N/A",
    Location: "N/A",
    "Is Commercial Vehicle": "N/A",
    "Stock Group": "N/A",
    Transmission: "N/A", // Added Transmission
    Condition: "N/A", // Added Condition
    "Fuel Type": "N/A", // Added Fuel Type
    Features: "N/A", // Added Features
    // Add more fields here if necessary
  };

  // Field Extraction Logic

  // 1. Stock Number
  let formGroup = findFormGroup("Stock Number");
  if (formGroup) {
    data["Stock Number"] = extractSpanValue(formGroup);
  }

  // 2. Entry Number
  formGroup = findFormGroup("Entry Number");
  if (formGroup) {
    data["Entry Number"] = extractSpanValue(formGroup);
  }

  // 3. Yard
  formGroup = findFormGroup("Yard");
  if (formGroup) {
    data["Yard"] = extractDropdownValue(formGroup);
  }

  // 4. Used/New
  formGroup = findFormGroup("Used/New");
  if (formGroup) {
    data["Used/New"] = extractDropdownValue(formGroup);
  }

  // 5. Is Demo (Checkbox)
  formGroup = findFormGroup("Is Demo");
  if (formGroup) {
    data["Is Demo"] = extractCheckboxValue(formGroup);
  }

  // 6. Registration No
  formGroup = findFormGroup("Registration No");
  if (formGroup) {
    data["Registration No"] = extractInputValue(formGroup);
  }

  // 7. Registration Expiry
  formGroup = findFormGroup("Registration Expiry");
  if (formGroup) {
    data["Registration Expiry"] = extractInputValue(formGroup);
  }

  // 8. Registration State
  formGroup = findFormGroup("Registration State");
  if (formGroup) {
    data["Registration State"] = extractDropdownValue(formGroup);
  }

  // 9. CTP Insurer
  formGroup = findFormGroup("CTP Insurer");
  if (formGroup) {
    data["CTP Insurer"] = extractDropdownValue(formGroup);
  }

  // 10. Registered To
  formGroup = findFormGroup("Registered To");
  if (formGroup) {
    data["Registered To"] = extractInputValue(formGroup);
  }

  // 11. Initial Registration Date
  formGroup = findFormGroup("Initial Registration Date");
  if (formGroup) {
    data["Initial Registration Date"] = extractInputValue(formGroup);
  }

  // 12. Rego Check Digit
  formGroup = findFormGroup("Rego Check Digit");
  if (formGroup) {
    data["Rego Check Digit"] = extractInputValue(formGroup);
  }

  // 13. Previous Registration
  formGroup = findFormGroup("Previous Registration");
  if (formGroup) {
    data["Previous Registration"] = extractInputValue(formGroup);
  }

  // 14. Stock Type
  formGroup = findFormGroup("Stock Type");
  if (formGroup) {
    data["Stock Type"] = extractSpanValue(formGroup);
  }

  // 15. Make
  formGroup = findFormGroup("Make");
  if (formGroup) {
    data["Make"] = extractSpanValue(formGroup);
  }

  // 16. Model
  formGroup = findFormGroup("Model");
  if (formGroup) {
    data["Model"] = extractSpanValue(formGroup);
  }

  // 17. Year
  formGroup = findFormGroup("Year");
  if (formGroup) {
    data["Year"] = extractSpanValue(formGroup);
  }

  // 18. Series
  formGroup = findFormGroup("Series");
  if (formGroup) {
    data["Series"] = extractSpanValue(formGroup);
  }

  // 19. Badge
  formGroup = findFormGroup("Badge");
  if (formGroup) {
    data["Badge"] = extractSpanValue(formGroup);
  }

  // 20. Body Style (Body)
  formGroup = findFormGroup("Body");
  if (formGroup) {
    data["Body Style"] = extractSpanValue(formGroup);
  }

  // 21. Redbook Description
  formGroup = findFormGroup("Redbook Description");
  if (formGroup) {
    data["Redbook Description"] = extractSpanValue(formGroup);
  }

  // 22. Colour
  formGroup = findFormGroup("Colour");
  if (formGroup) {
    data["Colour"] = extractInputValue(formGroup);
  }

  // 23. Interior Colour
  formGroup = findFormGroup("Interior Colour");
  if (formGroup) {
    data["Interior Colour"] = extractInputValue(formGroup);
  }

  // 24. Build Date
  formGroup = findFormGroup("Build Date");
  if (formGroup) {
    data["Build Date"] = extractInputValue(formGroup);
  }

  // 25. Compliance/RAV Entry Date
  formGroup = findFormGroup("Compliance/RAV Entry Date");
  if (formGroup) {
    data["Compliance/RAV Entry Date"] = extractInputValue(formGroup);
  }

  // 26. Engine Number
  formGroup = findFormGroup("Engine Number");
  if (formGroup) {
    data["Engine Number"] = extractInputValue(formGroup);
  }

  // 27. VIN Number
  formGroup = findFormGroup("VIN");
  if (formGroup) {
    data["VIN Number"] = extractInputValue(formGroup);
  }

  // 28. Chassis
  formGroup = findFormGroup("Manufacturer Chassis");
  if (formGroup) {
    data["Chassis"] = extractInputValue(formGroup);
  }

  // 29. Odometer
  formGroup = findFormGroup("Odometer");
  if (formGroup) {
    data["Kilometers Driven"] = extractInputValue(formGroup);
  }

  // 30. KMs/Miles (Radio Buttons)
  formGroup = findFormGroup("KMs/Miles");
  if (formGroup) {
    data["KMs/Miles"] = extractRadioValue(formGroup);
  }

  // 31. Green Vehicle Rating
  formGroup = findFormGroup("Green Vehicle Rating");
  if (formGroup) {
    data["Green Vehicle Rating"] = extractDropdownValue(formGroup);
  }

  // 32. Fuel Efficient LCT (Checkbox)
  formGroup = findFormGroup("Fuel Efficient LCT");
  if (formGroup) {
    data["Fuel Efficient LCT"] = extractCheckboxValue(formGroup);
  }

  // 33. Location
  formGroup = findFormGroup("Location");
  if (formGroup) {
    data["Location"] = extractDropdownValue(formGroup);
  }

  // 34. Is Commercial Vehicle (Checkbox)
  formGroup = findFormGroup("Is Commercial Vehicle");
  if (formGroup) {
    data["Is Commercial Vehicle"] = extractCheckboxValue(formGroup);
  }

  // 35. Stock Group
  formGroup = findFormGroup("Stock Group");
  if (formGroup) {
    data["Stock Group"] = extractDropdownValue(formGroup);
  }

  // 36. Transmission
  formGroup = findFormGroup("Transmission");
  if (formGroup) {
    data["Transmission"] = extractInputValue(formGroup);
  } else {
    // Handle cases where label might be "Steering" instead of "Transmission"
    formGroup = findFormGroup("Steering");
    if (formGroup) {
      data["Transmission"] = extractInputValue(formGroup); // Map "Steering" to "Transmission" if needed
    }
  }

  // 37. Condition
  formGroup = findFormGroup("Item Condition");
  if (formGroup) {
    data["Condition"] = extractDropdownValue(formGroup);
  }

  // 38. Fuel Type
  formGroup = findFormGroup("Fuel Type");
  if (formGroup) {
    data["Fuel Type"] = extractDropdownValue(formGroup);
  }

  // 39. Features (New Field)
  data["Features"] = extractFeatures();

  // Add more fields here if necessary

  console.log("EasyCars Data Extractor: Extracted Vehicle Data:", data);
  return data;
}

/**
 * Extracts all main stock photo URLs from the page.
 * @returns {Array<string>} - An array of complete photo URLs.
 */
function extractPhotoUrls() {
  console.log("EasyCars Data Extractor: Extracting photo URLs...");
  const photoElements = document.querySelectorAll(
    "#StockPhotosList img.img-responsive.pointer"
  );
  const photoUrls = [];

  photoElements.forEach((img) => {
    const relativePath = img.getAttribute("data-path");
    if (relativePath) {
      // Replace 'Thumbnail' with 'StockPhoto' in the URL path if necessary
      // Adjust this replacement based on actual URL structure
      const refactoredPath = relativePath.replace(
        "/Thumbnail/",
        "/StockPhoto/"
      );
      const mainPhotoUrl = new URL(refactoredPath, BASE_URL).href;
      photoUrls.push(mainPhotoUrl);
      console.log(
        `EasyCars Data Extractor: Found photo URL "${mainPhotoUrl}".`
      );
    } else {
      console.warn(
        `EasyCars Data Extractor: data-path attribute not found for an image.`
      );
    }
  });

  if (photoUrls.length === 0) {
    console.warn("EasyCars Data Extractor: No photos found.");
  } else {
    console.log(
      `EasyCars Data Extractor: Extracted ${photoUrls.length} photo URLs.`
    );
  }

  return photoUrls;
}

// Listen for messages from the popup or other extension components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractData") {
    console.log("EasyCars Data Extractor: Received 'extractData' request.");
    try {
      const vehicleData = extractVehicleData();
      sendResponse({ data: vehicleData });
    } catch (error) {
      console.error("EasyCars Data Extractor: Error extracting data:", error);
      sendResponse({ data: null, error: error.message });
    }
    // Indicate that the response will be sent asynchronously
    return true;
  }

  if (request.action === "extractPhotos") {
    console.log("EasyCars Data Extractor: Received 'extractPhotos' request.");
    try {
      const photoUrls = extractPhotoUrls();
      sendResponse({ photos: photoUrls });
    } catch (error) {
      console.error("EasyCars Data Extractor: Error extracting photos:", error);
      sendResponse({ photos: null, error: error.message });
    }
    return true;
  }
});
