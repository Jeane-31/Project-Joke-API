// import express from "express";
// import axios from "axios";
// import bodyParser from "body-parser";

// const app = express();
// const port = 3000;
// const API_URL = "https://v2.jokeapi.dev/joke"

// app.use(express.static("public"));

// app.get("/", (req, res) => {
//     res.render("index.ejs", { content: "Waiting for data..."});
// });

// app.post('/', (req, res) => {
//     console.log(req.body); // Log the form data to the console
//     res.render('index', { content: JSON.stringify(req.body, null, 2) });
//   });

// app.listen(port, () => {
//     console.log(`Server is running on ${port}`);
// });

// server.js

// server.js or index.js


// server.js or index.js

import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const API_URL = "https://v2.jokeapi.dev/joke";

// __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the form
app.get('/', (req, res) => {
  res.render('index', { content: 'Please submit the form to get a joke.' });
});

app.post('/', (req, res) => {
    console.log(req.body); // Log the form data to the console
  });

// Route to handle form submission
app.post('/', async (req, res) => {
  // Extract form data from req.body
  const {
    selectCategory,
    categories,
    blacklistFlags,
    responseFormat,
    jokeType,
    contains,
    idRangeFrom,
    idRangeTo,
    amount,
  } = req.body;

  // Initialize the API URL
  let apiUrl = `${API_URL}/`;

  // Handle category selection
  if (selectCategory === 'Any') {
    apiUrl += 'Any';
  } else if (selectCategory === 'Custom') {
    if (categories) {
      // Ensure categories is a comma-separated string
      const selectedCategories = Array.isArray(categories)
        ? categories.join(',')
        : categories;
      apiUrl += selectedCategories;
    } else {
      // If no categories are selected
      res.render('index', { content: 'Please select at least one category.' });
      return;
    }
  }

  // Initialize query parameters
  const params = {};

  // Add blacklist flags if any
  if (blacklistFlags) {
    const flags = Array.isArray(blacklistFlags)
      ? blacklistFlags.join(',')
      : blacklistFlags;
    params.blacklistFlags = flags;
  }

  // Adjusted handling of joke type
  if (jokeType) {
    const types = Array.isArray(jokeType) ? jokeType : [jokeType];

    if (types.length === 1) {
      // Only one type is selected; include it
      params.type = types[0]; // 'single' or 'twopart'
    } else {
      // Either both or neither are selected; do not include 'type' parameter
      delete params.type;
    }
  } else {
    // 'jokeType' is undefined or empty; do not include 'type' parameter
    delete params.type;
  }

  // Add search string if provided
  if (contains) {
    params.contains = contains;
  }

// Default values
const defaultIdRangeFrom = '0';
const defaultIdRangeTo = '1367';

// Only include idRange if the values are different from defaults
if (idRangeFrom !== defaultIdRangeFrom || idRangeTo !== defaultIdRangeTo) {
  // Use provided values or defaults if fields are empty
  const from = idRangeFrom || defaultIdRangeFrom;
  const to = idRangeTo || defaultIdRangeTo;
  params.idRange = `${from}-${to}`;
} else {
  // Do not include idRange in params
  delete params.idRange;
}


  // Add amount if specified
  if (amount && amount > 1) {
    params.amount = amount;
  }

  // Add response format if specified (Note: JokeAPI default is JSON)
  if (responseFormat && responseFormat !== 'json') {
    params.format = responseFormat;
  }

  try {
    // Build the full API URL with query parameters for logging (optional)
    const fullApiUrl = buildFullApiUrl(apiUrl, params);
    console.log(`API URL: ${fullApiUrl}`);

    // Make the API request using Axios
    const response = await axios.get(apiUrl, { params });

    let content = '';

    // Check if multiple jokes are returned
    if (response.data.error) {
      content = 'Error fetching joke. Please try again later.';
    } else if (response.data.jokes) {
      // Multiple jokes
      content = response.data.jokes
        .map((joke) => formatJoke(joke))
        .join('<hr>');
    } else {
      // Single joke
      content = formatJoke(response.data);
    }

    // Render the result
    res.render('index', { content });
  } catch (error) {
    console.error('Error fetching joke:', error);
    res.render('index', { content: 'Error fetching joke. Please try again later.' });
  }
});

// Function to format the joke based on its type
function formatJoke(jokeData) {
  if (jokeData.type === 'single') {
    return `<p>${jokeData.joke}</p>`;
  } else if (jokeData.type === 'twopart') {
    return `<p><strong>Setup:</strong> ${jokeData.setup}</p>
            <p><strong>Delivery:</strong> ${jokeData.delivery}</p>`;
  } else {
    return '<p>Unknown joke format.</p>';
  }
}

// Helper function to build the full API URL with query parameters for logging (optional)
function buildFullApiUrl(baseUrl, params) {
  const queryParams = new URLSearchParams(params).toString();
  return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});