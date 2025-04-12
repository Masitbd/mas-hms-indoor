import { Schema } from "mongoose";

export type TPatientService = {
  serviceCategory: string;
  seriveId: Schema.Types.ObjectId;
  servicedBy: string;
  amount: number;
};

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
  status: string;
  disease: string;
  isTransfer: boolean;
  tranferInfo: Schema.Types.ObjectId;
  admissionDate: string;
  firstAdmitDate: string;
  admissionTime: string;
  releaseDate: string;
  assignDoct: Schema.Types.ObjectId;
  refDoct: Schema.Types.ObjectId;
  allocatedBed: Schema.Types.ObjectId;
  paymentId: Schema.Types.ObjectId;
  services: [TPatientService];
  fixedBill: Schema.Types.ObjectId;
};
