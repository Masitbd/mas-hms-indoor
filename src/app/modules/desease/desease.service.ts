import { Desease } from "./desease.model";
import { TDesease } from "./desesse.interface";

const createDeseaseIntoDB = async (paylaod: TDesease) => {
  return await Desease.create(paylaod);
};
const getAllDeseaseIntoDB = async () => {
  return await Desease.find();
};
const updateDeseaseIntoDB = async (id: string, paylaod: TDesease) => {
  return await Desease.findByIdAndUpdate(id, paylaod, { new: true });
};
const deleteDeseaseIntoDB = async (id: string) => {
  return await Desease.findByIdAndDelete(id);
};

export const deseaseServices = {
  createDeseaseIntoDB,
  getAllDeseaseIntoDB,
  updateDeseaseIntoDB,
  deleteDeseaseIntoDB,
};
