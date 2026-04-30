const fs = require("fs");
const os = require("os");
const path = require("path");

const credentialsDir = path.join(os.homedir(), ".insighta");
const credentialsPath = path.join(credentialsDir, "credentials.json");

const ensureCredentialsDir = () => {
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true });
  }
};

const saveCredentials = (credentials) => {
  ensureCredentialsDir();

  fs.writeFileSync(
    credentialsPath,
    JSON.stringify(credentials, null, 2),
    "utf-8"
  );
};

const loadCredentials = () => {
  if (!fs.existsSync(credentialsPath)) {
    return null;
  }

  const raw = fs.readFileSync(credentialsPath, "utf-8");
  return JSON.parse(raw);
};

const clearCredentials = () => {
  if (fs.existsSync(credentialsPath)) {
    fs.unlinkSync(credentialsPath);
  }
};

module.exports = {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  credentialsPath
};