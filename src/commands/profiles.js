const axios = require("axios");
const Table = require("cli-table3");

const API_BASE_URL =
  process.env.INSIGHTA_API_URL ||
  "https://stage3-backendnew.onrender.com";

// 👉 Helper to load saved credentials
const loadCredentials = () => {
  try {
    const fs = require("fs");
    const path = require("path");

    const filePath = path.join(
      require("os").homedir(),
      ".insighta",
      "credentials.json"
    );

    if (!fs.existsSync(filePath)) {
      console.log("❌ Not logged in. Run: insighta login");
      process.exit(1);
    }

    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.log("❌ Failed to load credentials");
    process.exit(1);
  }
};

// 👉 Helper for API requests
const apiRequest = async (url, method = "GET", data = null) => {
  const creds = loadCredentials();

  try {
    const res = await axios({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "X-API-Version": "1"
      }
    });

    return res.data;
  } catch (err) {
    console.error("❌ API Error:", err.response?.data || err.message);
    process.exit(1);
  }
};

// 👉 Format table output
const printTable = (profiles) => {
  const table = new Table({
    head: ["ID", "Name", "Gender", "Age", "Country"]
  });

  profiles.forEach((p) => {
    table.push([
      p.id,
      p.name,
      p.gender || "-",
      p.age || "-",
      p.country_name || "-"
    ]);
  });

  console.log(table.toString());
};

// 👉 MAIN FUNCTION
const registerProfileCommands = (program) => {
  const profiles = program
    .command("profiles")
    .description("Manage and query profiles");

  // 📌 LIST
  profiles
    .command("list")
    .option("--limit <number>", "Limit results", "5")
    .action(async (opts) => {
      const res = await apiRequest(
        `/api/profiles?limit=${opts.limit}`
      );

      printTable(res.data);
    });

  // 📌 SEARCH
  profiles
    .command("search")
    .argument("<query>", "Search query")
    .action(async (query) => {
      const res = await apiRequest(
        `/api/profiles/search?q=${encodeURIComponent(query)}`
      );

      printTable(res.data);
    });

  // 📌 GET SINGLE
  profiles
    .command("get")
    .argument("<id>", "Profile ID")
    .action(async (id) => {
      const res = await apiRequest(`/api/profiles/${id}`);
      console.log(res.data);
    });

  // 📌 CREATE (admin only)
  profiles
    .command("create")
    .requiredOption("--name <name>", "Profile name")
    .action(async (opts) => {
      const res = await apiRequest(
        "/api/profiles",
        "POST",
        { name: opts.name }
      );

      console.log("✅ Created:", res.data);
    });

  // 📌 EXPORT CSV
  profiles
    .command("export")
    .option("--format <type>", "Format", "csv")
    .action(async (opts) => {
      const creds = loadCredentials();

      try {
        const res = await axios({
          url: `${API_BASE_URL}/api/profiles/export?format=${opts.format}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${creds.access_token}`,
            "X-API-Version": "1"
          },
          responseType: "stream"
        });

        const fs = require("fs");
        const file = fs.createWriteStream("profiles.csv");

        res.data.pipe(file);

        console.log("📁 CSV exported as profiles.csv");
      } catch (err) {
        console.error("❌ Export failed");
      }
    });
};

module.exports = {
  registerProfileCommands
};