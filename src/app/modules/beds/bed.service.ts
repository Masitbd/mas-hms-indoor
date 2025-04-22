import mongoose from "mongoose";

import { Bed } from "./bed.model";
import { TBedAllocation } from "./bed.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import { bedSearchablefields } from "./bedConstance";

const createBedIntoDB = async (payload: TBedAllocation) => {
  const result = await Bed.create(payload);
  return result;
};

// get all beds

const getAllBedsFromDB = async (query: Record<string, any>) => {
  const queryParams: Record<string, any> = {
    isDeleted: false,
    isAllocated: false,
  };

  const bedQuery = new QueryBuilder(
    Bed.find(queryParams).select("-isDeleted").populate("worldId", "worldName"),
    query
  ).filter();

  const result = await bedQuery.modelQuery;

  return result;
};

const getAllBedsForAdminFromDB = async (query: Record<string, any>) => {
  const bedQuery = new QueryBuilder(
    Bed.find({ isDeleted: false })
      .select("-isDeleted")
      .populate("worldId", "worldName"),
    query
  )
    .search(bedSearchablefields)
    .filter();

  const result = await bedQuery.modelQuery;

  return result;
};

//  update

const updateBedsIntoDB = async (
  id: string,
  payload: Partial<TBedAllocation>
) => {
  return await Bed.findByIdAndUpdate(id, payload, { new: true });
};

// delete bed

const deleteBedFromDB = async (id: string) => {
  const result = await Bed.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  return result;
};

export const BedServices = {
  createBedIntoDB,
  getAllBedsFromDB,
  getAllBedsForAdminFromDB,
  updateBedsIntoDB,
  deleteBedFromDB,
};
