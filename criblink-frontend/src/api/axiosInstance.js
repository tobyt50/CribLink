// criblink-frontend/src/api/axiosInstance.js
import axios from 'axios';

// We'll need a way to access the loading context from here.
// This is a common pattern for Axios interceptors that need context.
// We'll export a function to set the loading context functions.
let showLoadingGlobal;
let hideLoadingGlobal;

export const setLoadingFunctions = (show, hide) => {
  showLoadingGlobal = show;
  hideLoadingGlobal = hide;
};

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Show loading spinner before the request is sent
    if (showLoadingGlobal) {
      showLoadingGlobal();
    }
    return config;
  },
  (error) => {
    // Hide loading spinner if request fails before being sent
    if (hideLoadingGlobal) {
      hideLoadingGlobal();
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Hide loading spinner when response is received
    if (hideLoadingGlobal) {
      hideLoadingGlobal();
    }
    return response;
  },
  (error) => {
    // Hide loading spinner if response error is received
    if (hideLoadingGlobal) {
      hideLoadingGlobal();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
