import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:4000';

export const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});
