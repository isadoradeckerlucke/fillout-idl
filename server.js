const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

function applyFilters(responses, filters) {
  responses.filter((r) => {
    return filters.every((filter) => {
      const { id, condition, value } = filter;
      const q = r.questions.find((question) => question.id === id);
      if (!q) return false;

      switch (condition) {
        case "equals":
          return q.value === value;
        case "does_not_equal":
          return q.value !== value;
        case "greater_than":
          return q.value > value;
        case "less_than":
          return q.value < value;
        default:
          return false;
      }
    });
  });
}

app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const formId = req.params.formId;
    const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;

    // don't want to throw an error if they don't enter any params, all params are optional
    const queryLength = Object.keys(req.query).length;
    if (Object.keys(req.query).length === 0) {
      const genericResult = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      res.json(genericResult.data);
    } else {
      const { filters, afterDate, beforeDate } = req.query;
      const limit = req.query.limit || 150;
      const offset = req.query.offset || 0;
      const status = req.query.status || "finished";
      const includeEditLink = req.query.includeEditLink || false;
      const sort = req.query.sort || "asc";

      const parsedFilters = JSON.parse(filters);
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          limit,
          afterDate,
          beforeDate,
          offset,
          status,
          includeEditLink,
          sort,
        },
      });

      const data = response.data;
      const filteredResponses = applyFilters(data.responses, parsedFilters);
      if (!filteredResponses)
        console.log("No responses meet the filter criteria.");
      res.json(filteredResponses);
    }
  } catch (error) {
    console.error("Error in /:formId/filteredResponses endpoint: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`IDL Fillout screening server is running on port ${port}`);
});
