import axios from 'axios';

export const merekApi = axios.create({
  baseURL: process.env.MEREK_BASE_URL,
});
