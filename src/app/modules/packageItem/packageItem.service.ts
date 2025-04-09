import { TPackage } from "./packageItem.interface";
import { PackageItem } from "./packageItem.model";

const createPackageIntoDB = async (payload: TPackage) => {
  return await PackageItem.create(payload);
};

const getAllPackageFromDB = async () => {
  return await PackageItem.find();
};
const updatePackageIntoDB = async (id: string, payload: TPackage) => {
  return await PackageItem.findByIdAndUpdate(id, payload, { new: true });
};
const deletePackageFromDB = async (id: string) => {
  return await PackageItem.findByIdAndDelete(id);
};

export const packageServices = {
  createPackageIntoDB,
  getAllPackageFromDB,
  updatePackageIntoDB,
  deletePackageFromDB,
};
