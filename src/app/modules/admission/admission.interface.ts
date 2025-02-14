import { Schema } from "mongoose";

export type TPAdmission = {
  regNo: string;
  name: string;
  gender: string;
  fatherName: string;
  presentAddress: string;
  permanentAddress: string;
  age: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  residence: string;
  citizenShip: string;
  religion: string;
  bloodGroup: string;
  district: string;
  phone: string;
  allocatedBed: Schema.Types.ObjectId;
  paymentId: Schema.Types.ObjectId;
};
