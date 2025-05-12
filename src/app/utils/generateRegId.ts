// let currentId = 0;

import { Admission } from "../modules/admission/admission.model";

const findLastRegId = async () => {
  const lastItem = await Admission.findOne(
    {},
    {
      regNo: 1,
      _id: 0,
    }
  )
    .sort({
      regNo: -1,
    })
    .lean();

  return lastItem?.regNo ? lastItem.regNo : undefined;
};

export const generateRegId = async () => {
  let currentId = "0";
  const lastRegId = await findLastRegId();

  if (lastRegId) {
    currentId = lastRegId.slice(-4);
   
  }

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);

  const incrementId = (Number(currentId) + 1).toString().padStart(4, "0");

  return `${year}${month}${incrementId}`;
};
