"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalEntryService = exports.postAdmissionJournalEntry = void 0;
const axios_1 = require("../../../shared/axios");
const accountServiceApiPath_1 = require("../../enum/accountServiceApiPath");
const ENUMAccountHeads_1 = __importDefault(require("../../enum/ENUMAccountHeads"));
const ENUMBudgetType_1 = require("../../enum/ENUMBudgetType");
const ENUMJournalTYpe_1 = require("../../enum/ENUMJournalTYpe");
const postAdmissionJournalEntry = (_a) => __awaiter(void 0, [_a], void 0, function* ({ orderAmount, paid, due, token, }) {
    const journalEntry = [
        {
            account: ENUMAccountHeads_1.default.Service_Income_Indoor,
            credit: orderAmount,
            debit: 0,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Patient Admitted",
        },
    ];
    if (paid) {
        journalEntry.unshift({
            account: ENUMAccountHeads_1.default.CashInHand,
            credit: 0,
            debit: paid,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Patient Admitted",
        });
    }
    if (due) {
        journalEntry.unshift({
            account: ENUMAccountHeads_1.default.AccountsReceivable,
            credit: 0,
            debit: due,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Patient Admitted",
        });
    }
    const result = yield axios_1.AccountService.post(accountServiceApiPath_1.Account_Service_Api_Path.JOURNAL, journalEntry, {
        headers: {
            Authorization: token,
        },
    });
    return result;
});
exports.postAdmissionJournalEntry = postAdmissionJournalEntry;
const postJournalEntryForDueCollection = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amount, token, }) {
    const journalEntry = [
        {
            account: ENUMAccountHeads_1.default.CashInHand,
            credit: 0,
            debit: amount,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Due collected Indoor Patient",
        },
        {
            account: ENUMAccountHeads_1.default.AccountsReceivable,
            credit: amount,
            debit: 0,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Due collected Indoor Patient",
        },
    ];
    const result = yield axios_1.AccountService.post(accountServiceApiPath_1.Account_Service_Api_Path.JOURNAL, journalEntry, {
        headers: {
            Authorization: token,
        },
    });
    return result;
});
const postJournalEntryForBedTransfer = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amount, token, }) {
    const journalEntry = [
        {
            account: ENUMAccountHeads_1.default.AccountsReceivable,
            credit: 0,
            debit: amount,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Amount for bed Transfer",
        },
        {
            account: ENUMAccountHeads_1.default.Service_Income_Indoor,
            credit: amount,
            debit: 0,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "Amount for bed Transfer",
        },
    ];
    const result = yield axios_1.AccountService.post(accountServiceApiPath_1.Account_Service_Api_Path.JOURNAL, journalEntry, {
        headers: {
            Authorization: token,
        },
    });
    return result;
});
const postJournalEntryForServiceAdd = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amount, token, }) {
    const journalEntry = [
        {
            account: ENUMAccountHeads_1.default.AccountsReceivable,
            credit: 0,
            debit: amount,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "TO record Added service to the Admitted patient",
        },
        {
            account: ENUMAccountHeads_1.default.Service_Income_Indoor,
            credit: amount,
            debit: 0,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "TO record Added service to the Admitted patient",
        },
    ];
    const result = yield axios_1.AccountService.post(accountServiceApiPath_1.Account_Service_Api_Path.JOURNAL, journalEntry, {
        headers: {
            Authorization: token,
        },
    });
    return result;
});
const postJournalEntryForDoctorCommission = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amount, token, }) {
    const journalEntry = [
        {
            account: ENUMAccountHeads_1.default.CommissionExpense,
            credit: 0,
            debit: amount,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "To record Doctors Commission payable for test ",
        },
        {
            account: ENUMAccountHeads_1.default.CommissionPayable,
            credit: amount,
            debit: 0,
            journalType: ENUMJournalTYpe_1.ENUMJournalType.GENERAL,
            budgetType: ENUMBudgetType_1.ENUMBudgetType.REGULAR,
            memo: "To record Doctors Commission payable for test",
        },
    ];
    const result = yield axios_1.AccountService.post(accountServiceApiPath_1.Account_Service_Api_Path.JOURNAL, journalEntry, {
        headers: {
            Authorization: token,
        },
    });
    return result;
});
exports.journalEntryService = {
    postAdmissionJournalEntry: exports.postAdmissionJournalEntry,
    postJournalEntryForDueCollection,
    postJournalEntryForDoctorCommission,
    postJournalEntryForBedTransfer,
    postJournalEntryForServiceAdd,
};
