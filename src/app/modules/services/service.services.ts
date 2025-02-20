import { TServices } from "./service.interface";
import { Service } from "./service.model";

const createServiceIntoDB = async (payload: TServices) => {
  const result = await Service.create(payload);
  return result;
};

// get all services

const getAllServicesFromDB = async () => {
  const result = await Service.find();
  return result;
};
