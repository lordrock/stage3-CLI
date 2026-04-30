const axios = require("axios");
const chalk = require("chalk");
const ora = require("ora");

const { API_BASE_URL } = require("../config");
const {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  credentialsPath
} = require("../utils/credentials");

const registerAuthCommands = (program) => {
  program
    .command("dev-login")
    .description("Login using development admin account")
    .action(async () => {
      const spinner = ora("Logging in...").start();

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/dev-login`);

        saveCredentials({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          user: response.data.user
        });

        spinner.succeed(`Logged in as ${response.data.user.username}`);
        console.log(chalk.gray(`Credentials saved to ${credentialsPath}`));
      } catch (error) {
        spinner.fail("Login failed");
        console.error(
          chalk.red(error.response?.data?.message || error.message)
        );
      }
    });

  program
    .command("whoami")
    .description("Show current authenticated user")
    .action(async () => {
      const credentials = loadCredentials();

      if (!credentials?.access_token) {
        console.log(chalk.yellow("You are not logged in."));
        return;
      }

      const spinner = ora("Checking current user...").start();

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`
          }
        });

        spinner.succeed("Authenticated");

        console.log(chalk.green(`Username: ${response.data.data.username}`));
        console.log(chalk.green(`Role: ${response.data.data.role}`));
        console.log(chalk.green(`Email: ${response.data.data.email || "N/A"}`));
      } catch (error) {
        spinner.fail("Could not verify session");
        console.error(
          chalk.red(error.response?.data?.message || error.message)
        );
      }
    });

  program
    .command("logout")
    .description("Logout and clear local credentials")
    .action(async () => {
      const credentials = loadCredentials();

      if (credentials?.refresh_token) {
        try {
          await axios.post(`${API_BASE_URL}/auth/logout`, {
            refresh_token: credentials.refresh_token
          });
        } catch (error) {
          // logout should still clear local credentials
        }
      }

      clearCredentials();
      console.log(chalk.green("Logged out successfully"));
    });
};

module.exports = {
  registerAuthCommands
};