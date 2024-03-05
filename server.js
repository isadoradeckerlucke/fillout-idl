const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
const apiKey =
  "sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912";

function applyFilters(responses, filters) {
  return responses.filter((response) => {
    return filters.every((filter) => {
      const { id, condition, value } = filter;
      const q = response.questions.find((question) => question.id === id);
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
    const filters = req.query.filters;

    const parsedFilters = JSON.parse(filters);
    const apiUrl = `https://www.fillout.com/api/forms/${formId}/responses`;

    const res = await axios.get(apiUrl, { Authorization: `Bearer ${apiKey}` });

    const filteredResponses = applyFilters(res.data.responses, parsedFilters);

    res.json(filteredResponses);
  } catch (error) {
    console.error("Error in /:formId/filteredResponses endpoint: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`IDL Fillout screening server is running on port ${port}`);
});
