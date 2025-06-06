import axios from 'axios';
// Helper function to get access token
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

// Create authenticated Axios instance


export const authAxios = axios.create();

// Add request interceptor to inject token
authAxios.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});