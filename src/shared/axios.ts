import axios from 'axios';

export const merekApi = axios.create({
  baseURL: 'https://merek.dgip.go.id',
});
