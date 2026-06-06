import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_URL;


const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // automatic cancel after 10s
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;