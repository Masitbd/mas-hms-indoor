import { Schema } from "mongoose";

export type TBedAllocation = {
  bedName: string;
  isAllocated: boolean;
  phone: string;
  floor: string;
  worldId: Schema.Types.ObjectId;
  isDeleted: boolean;
};
