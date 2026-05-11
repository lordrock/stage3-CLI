const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

const API_BASE_URL =
  process.env.INSIGHTA_API_URL || "https://stage3-backendnew.onrender.com";

const credentialsDir = path.join(os.homedir(), ".insighta");
const credentialsPath = path.join(credentialsDir, "credentials.json");

const ensureDir = () => {
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true });
  }
};

const saveCredentials = (data) => {
  ensureDir();
  fs.writeFileSync(credentialsPath, JSON.stringify(data, null, 2));
};

const loadCredentials = () => {
  if (!fs.existsSync(credentialsPath)) return null;
  return JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
};

const clearCredentials = () => {
  if (fs.existsSync(credentialsPath)) {
    fs.unlinkSync(credentialsPath);
  }
};

const registerAuthCommands = (program) => {
  program
    .command("dev-login")
    .option("--role <role>", "admin or analyst", "admin")
    .description("Login with development account")
    .action(async (opts) => {
      console.log("Logging in...");

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/dev-login?role=${opts.role}`
        );

        saveCredentials({
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token,
          user: res.data.user || {
            username: `dev-${opts.role}`,
            role: opts.role
          }
        });

        console.log(`✅ Logged in as ${opts.role}`);
        console.log(`📁 Credentials saved to ${credentialsPath}`);
      } catch (err) {
        console.error("❌ Login failed:");
        console.error(err.response?.data || err.message);
      }
    });

  program
    .command("whoami")
    .description("Show current user")
    .action(async () => {
      const creds = loadCredentials();

      if (!creds?.access_token) {
        console.log("❌ Not logged in. Run: insighta dev-login");
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${creds.access_token}`
          }
        });

        console.log("✅ Current user:");
        console.log(res.data.data);
      } catch (err) {
        console.error("❌ Could not verify user:");
        console.error(err.response?.data || err.message);
      }
    });

  program
    .command("logout")
    .description("Logout")
    .action(async () => {
      const creds = loadCredentials();

      try {
        if (creds?.refresh_token) {
          await axios.post(`${API_BASE_URL}/auth/logout`, {
            refresh_token: creds.refresh_token
          });
        }
      } catch (_) {}

      clearCredentials();
      console.log("✅ Logged out successfully");
    });
};

module.exports = {
  registerAuthCommands
};