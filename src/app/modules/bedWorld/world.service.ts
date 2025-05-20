import { TWorld } from "./world.interface";
import { BedWorld } from "./world.model";

const createBedWorldIntoDB = (payload: TWorld) => {
  return BedWorld.create(payload);
};

// get all

const getAllBedWorldFromDB = () => {
  return BedWorld.find();
};

// get by id

const getBedWorldByIdFromDB = async (id: string) => {
  return await BedWorld.findById(id);
};

// update

const updateBedWorldIntoDB = async (id: string, payload: Partial<TWorld>) => {
  return await BedWorld.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

// delete

const deleteBedWorldFromDB = (id: string) => {
  return BedWorld.findByIdAndDelete(id);
};

export const worldServices = {
  createBedWorldIntoDB,
  getAllBedWorldFromDB,
  getBedWorldByIdFromDB,
  updateBedWorldIntoDB,
  deleteBedWorldFromDB,
};
