const axios = require("axios");
const Table = require("cli-table3");
const fs = require("fs");
const os = require("os");
const path = require("path");

const API_BASE_URL =
  process.env.INSIGHTA_API_URL || "https://stage3-backendnew.onrender.com";

const credentialsPath = path.join(os.homedir(), ".insighta", "credentials.json");

const loadCredentials = () => {
  if (!fs.existsSync(credentialsPath)) {
    console.log("❌ Not logged in. Run: insighta dev-login");
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
};

const apiRequest = async ({ method = "GET", url, data }) => {
  const creds = loadCredentials();

  const res = await axios({
    method,
    url: `${API_BASE_URL}${url}`,
    data,
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      "X-API-Version": "1"
    }
  });

  return res.data;
};

const registerQueryCommands = (program) => {
  const queries = program
    .command("queries")
    .description("Manage saved queries");

  queries
    .command("save")
    .description("Save a query")
    .requiredOption("--name <name>", "Saved query name")
    .requiredOption("--gender <gender>", "Gender filter")
    .requiredOption("--country <country>", "Country code")
    .option("--favorite", "Mark as favorite")
    .action(async (opts) => {
      try {
        const response = await apiRequest({
          method: "POST",
          url: "/api/queries/save",
          data: {
            name: opts.name,
            filters: {
              gender: opts.gender,
              country_id: opts.country
            },
            favorite: Boolean(opts.favorite)
          }
        });

        console.log("✅ Query saved:");
        console.log(response.data);
      } catch (err) {
        console.log("❌ Failed to save query");
        console.log(err.response?.data || err.message);
      }
    });

  queries
    .command("list")
    .description("List saved queries")
    .action(async () => {
      try {
        const response = await apiRequest({
          url: "/api/queries"
        });

        const table = new Table({
          head: ["ID", "Name", "Favorite", "Last Run"]
        });

        response.data.forEach((query) => {
          table.push([
            query.id,
            query.name,
            query.favorite ? "yes" : "no",
            query.last_run_at || "-"
          ]);
        });

        console.log(table.toString());
      } catch (err) {
        console.log("❌ Failed to list queries");
        console.log(err.response?.data || err.message);
      }
    });

  queries
    .command("run")
    .description("Run a saved query")
    .argument("<id>", "Saved query ID")
    .action(async (id) => {
      try {
        const response = await apiRequest({
          method: "POST",
          url: `/api/queries/${id}/run`
        });

        console.log(`✅ Results for: ${response.query.name}`);

        const table = new Table({
          head: ["Name", "Gender", "Age", "Country"]
        });

        response.results.forEach((profile) => {
          table.push([
            profile.name,
            profile.gender,
            profile.age,
            profile.country_name
          ]);
        });

        console.log(table.toString());
      } catch (err) {
        console.log("❌ Failed to run query");
        console.log(err.response?.data || err.message);
      }
    });

  queries
    .command("delete")
    .description("Delete a saved query")
    .argument("<id>", "Saved query ID")
    .action(async (id) => {
      try {
        await apiRequest({
          method: "DELETE",
          url: `/api/queries/${id}`
        });

        console.log("✅ Query deleted");
      } catch (err) {
        console.log("❌ Failed to delete query");
        console.log(err.response?.data || err.message);
      }
    });
};

module.exports = {
  registerQueryCommands
};