import { status } from "http-status";
export type TServices = {
  name: string;
  rate: number;
  vat: number;
  isFixed: boolean;
  fixedRate: number;
  status: string;
};
