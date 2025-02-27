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

const getBedWorldByIdFromDB = (id: string) => {
  return BedWorld.findById(id);
};

// update

const updateBedWorldIntoDB = (id: string, payload: Partial<TWorld>) => {
  return BedWorld.findByIdAndUpdate(id, payload, {
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
