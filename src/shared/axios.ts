import axios, { AxiosInstance } from "axios";
import { config } from "../app/config";

const HttpService = (baseUrl: string): AxiosInstance => {
  // console.log(baseUrl, 'basse');

  const instance = axios.create({
    baseURL: baseUrl,
    timeout: 6000000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return error;
    }
  );

  instance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

const AccountService = HttpService(config.accountServiceUrl as string);

export { AccountService, HttpService };
