"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldServices = void 0;
const world_model_1 = require("./world.model");
const createBedWorldIntoDB = (payload) => {
    return world_model_1.BedWorld.create(payload);
};
// get all
const getAllBedWorldFromDB = () => {
    return world_model_1.BedWorld.find();
};
// get by id
const getBedWorldByIdFromDB = (id) => {
    return world_model_1.BedWorld.findById(id);
};
// update
const updateBedWorldIntoDB = (id, payload) => {
    return world_model_1.BedWorld.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};
// delete
const deleteBedWorldFromDB = (id) => {
    return world_model_1.BedWorld.findByIdAndDelete(id);
};
exports.worldServices = {
    createBedWorldIntoDB,
    getAllBedWorldFromDB,
    getBedWorldByIdFromDB,
    updateBedWorldIntoDB,
    deleteBedWorldFromDB,
};
