import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

const GET_DEDUP_WINDOW_MS = 5_000;
const getCache = new Map();
let refreshPromise = null;

function requestKey(url, config = {}) {
  const token = localStorage.getItem("accessToken") || "anonymous";
  const params = config.params ? JSON.stringify(Object.keys(config.params).sort().reduce((result, key) => {
    result[key] = config.params[key];
    return result;
  }, {})) : "";
  return `${token}:${url}?${params}`;
}

export function clearApiGetCache() {
  getCache.clear();
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // A mutation can alter any previously fetched collection or balance. We only
  // deduplicate short-lived GETs; no POST/PUT/DELETE response is ever cached.
  if ((config.method || "get").toLowerCase() !== "get") clearApiGetCache();

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isAuthRequest = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        refreshPromise ??= axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          .finally(() => { refreshPromise = null; });
        const refreshRes = await refreshPromise;

        const { accessToken: newAccessToken, refreshToken: nextRefreshToken } = refreshRes.data.data;

        localStorage.setItem("accessToken", newAccessToken);
        if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
        clearApiGetCache();

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const key = requestKey(url, config);
  const cached = getCache.get(key);
  if (cached && Date.now() - cached.createdAt < GET_DEDUP_WINDOW_MS) return cached.promise;

  const promise = rawGet(url, config).catch((error) => {
    // Errors must not be cached: the user should be able to retry immediately.
    getCache.delete(key);
    throw error;
  });
  getCache.set(key, { createdAt: Date.now(), promise });
  return promise;
};

export default api;
