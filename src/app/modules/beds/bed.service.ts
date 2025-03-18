import mongoose from "mongoose";

import { Bed } from "./bed.model";
import { TBedAllocation } from "./bed.interface";
import QueryBuilder from "../../builder/QueryBuilder";

const createBedIntoDB = async (payload: TBedAllocation) => {
  const result = await Bed.create(payload);
  return result;
};

// get all beds

const getAllBedsFromDB = async (query: Record<string, any>) => {
  const queryParams =
    Object.keys(query).length === 0 ? {} : { isAllocated: false };

  const bedQuery = new QueryBuilder(
    Bed.find(queryParams).populate("worldId", "worldName"),
    query
  ).filter();

  const result = await bedQuery.modelQuery;

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

const updateBedsIntoDB = async (
  id: string,
  payload: Partial<TBedAllocation>
) => {
  const { bed, filterBed, ...remainingData } = payload as TBedAllocation & {
    bed: Partial<TBedAllocation>;
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
