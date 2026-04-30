const chalk = require("chalk");
const ora = require("ora");
const Table = require("cli-table3");

const { createApiClient } = require("../utils/apiClient");

const buildListParams = (options) => {
  const params = {};

  if (options.gender) params.gender = options.gender;
  if (options.country) params.country_id = options.country;
  if (options.ageGroup) params.age_group = options.ageGroup;
  if (options.minAge) params.min_age = options.minAge;
  if (options.maxAge) params.max_age = options.maxAge;
  if (options.minGenderProbability) {
    params.min_gender_probability = options.minGenderProbability;
  }
  if (options.minCountryProbability) {
    params.min_country_probability = options.minCountryProbability;
  }
  if (options.sortBy) params.sort_by = options.sortBy;
  if (options.order) params.order = options.order;
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;

  return params;
};

const printProfilesTable = (profiles) => {
  const table = new Table({
    head: [
      "Name",
      "Gender",
      "Age",
      "Group",
      "Country",
      "G. Prob",
      "C. Prob"
    ]
  });

  profiles.forEach((profile) => {
    table.push([
      profile.name,
      profile.gender,
      profile.age,
      profile.age_group,
      `${profile.country_name} (${profile.country_id})`,
      profile.gender_probability,
      profile.country_probability
    ]);
  });

  console.log(table.toString());
};

const registerProfileCommands = (program) => {
  const profiles = program
    .command("profiles")
    .description("Manage and query profiles");

  profiles
  .command("get")
  .description("Get a single profile by ID")
  .argument("<id>", "Profile ID")
  .action(async (id) => {
    const spinner = ora("Fetching profile...").start();

    try {
      const api = createApiClient();

      const response = await api.get(`/api/profiles/${id}`);

      spinner.succeed("Profile found");

      printProfilesTable([response.data.data]);
    } catch (error) {
      spinner.fail("Failed to fetch profile");

      const message =
        error.response?.data?.message ||
        "Unable to fetch profile. Try logging in again.";

      console.error(chalk.red(message));
    }
  });

profiles
  .command("search")
  .description("Search profiles using natural language")
  .argument("<query>", "Natural language query")
  .option("--page <page>", "Page number")
  .option("--limit <limit>", "Page limit")
  .action(async (query, options) => {
    const spinner = ora("Searching profiles...").start();

    try {
      const api = createApiClient();

      const response = await api.get("/api/profiles/search", {
        params: {
          q: query,
          page: options.page,
          limit: options.limit
        }
      });

      spinner.succeed(
        `Found ${response.data.data.length} profiles out of ${response.data.total}`
      );

      printProfilesTable(response.data.data);

      console.log(
        chalk.gray(
          `Page ${response.data.page}/${response.data.total_pages} | Limit ${response.data.limit}`
        )
      );
    } catch (error) {
      spinner.fail("Search failed");

      const message =
        error.response?.data?.message ||
        "Unable to search profiles. Try logging in again.";

      console.error(chalk.red(message));
    }
  });

};

profiles
  .command("create")
  .description("Create a new profile")
  .requiredOption("--name <name>", "Profile name")
  .action(async (options) => {
    const spinner = ora("Creating profile...").start();

    try {
      const api = createApiClient();

      const response = await api.post("/api/profiles", {
        name: options.name
      });

      spinner.succeed("Profile created");

      printProfilesTable([response.data.data]);
    } catch (error) {
      spinner.fail("Failed to create profile");

      const message =
        error.response?.data?.message ||
        "Unable to create profile. Admin access may be required.";

      console.error(chalk.red(message));
    }
  });

  profiles
  .command("export")
  .description("Export profiles as CSV")
  .requiredOption("--format <format>", "Export format, currently csv")
  .option("--gender <gender>", "Filter by gender")
  .option("--country <country>", "Filter by country code, e.g. NG")
  .option("--age-group <ageGroup>", "Filter by age group")
  .option("--min-age <minAge>", "Minimum age")
  .option("--max-age <maxAge>", "Maximum age")
  .option("--sort-by <field>", "Sort by age, created_at, or gender_probability")
  .option("--order <order>", "asc or desc")
  .action(async (options) => {
    const fs = require("fs");
    const path = require("path");

    const spinner = ora("Exporting profiles...").start();

    try {
      const api = createApiClient();

      const params = {
        format: options.format,
        ...buildListParams(options)
      };

      const response = await api.get("/api/profiles/export", {
        params,
        responseType: "text"
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `profiles_${timestamp}.csv`;
      const filePath = path.join(process.cwd(), fileName);

      fs.writeFileSync(filePath, response.data, "utf-8");

      spinner.succeed(`CSV exported to ${filePath}`);
    } catch (error) {
      spinner.fail("Export failed");

      const message =
        error.response?.data?.message ||
        "Unable to export profiles. Try logging in again.";

      console.error(chalk.red(message));
    }
  });

module.exports = {
  registerProfileCommands
};