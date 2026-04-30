const axios = require("axios");
const { API_BASE_URL } = require("../config");
const {
  loadCredentials,
  saveCredentials,
  clearCredentials
} = require("./credentials");

const refreshAccessToken = async () => {
  const credentials = loadCredentials();

  if (!credentials?.refresh_token) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refresh_token: credentials.refresh_token
  });

  const updatedCredentials = {
    ...credentials,
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token
  };

  saveCredentials(updatedCredentials);

  return updatedCredentials.access_token;
};

const createApiClient = () => {
  const credentials = loadCredentials();

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: credentials?.access_token
        ? `Bearer ${credentials.access_token}`
        : undefined,
      "X-API-Version": "1"
    }
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const newAccessToken = await refreshAccessToken();

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          clearCredentials();

          throw new Error(
            "Session expired. Please login again with: insighta dev-login"
          );
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
};

module.exports = {
  createApiClient,
  refreshAccessToken
};