import mongoose from "mongoose";
import { TAllocation, TBeds } from "./bed.interface";
import { Bed } from "./bed.model";

const createBedIntoDB = async (payload: TBeds) => {
  const result = await Bed.create(payload);
  return result;
};

// get all beds

const getAllBedsFromDB = async () => {
  const result = await Bed.find();
  return result;
};

// get by available world Name

const getBedByWorldNameAndAvailablityFromDB = async (id: string) => {
  const result = await Bed.findOne({
    _id: mongoose.Types.ObjectId.createFromBase64(id),
    beds: { $elemMatch: { isAllocated: false } },
  });

  return result;
};

//  update

const updateBedsIntoDB = async (id: string, payload: Partial<TBeds>) => {
  const { bed, filterBed, ...remainingData } = payload as TBeds & {
    bed: Partial<TAllocation>;
    filterBed?: { _id: string };
  };

  const modifiedData: Record<string, any> = { ...remainingData };

  if (bed && Object.keys(bed)) {
    for (const [key, value] of Object.entries(bed)) {
      modifiedData[`beds.$[bedElem].${key}`] = value;
    }
  }

  const result = await Bed.findByIdAndUpdate(id, modifiedData, {
    new: true,
    runValidators: true,
    arrayFilters: [{ "bedEle._id": filterBed?._id }],
  });

  return result;
};

// delete bed

const deleteBedFromDB = async (id: string) => {
  const result = await Bed.findByIdAndDelete(id);

  return result;
};

export const BedServices = {
  createBedIntoDB,
  getAllBedsFromDB,
  getBedByWorldNameAndAvailablityFromDB,
  updateBedsIntoDB,
  deleteBedFromDB,
};
