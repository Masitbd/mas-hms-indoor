import { AccountService } from "../../../shared/axios";
import { Account_Service_Api_Path } from "../../enum/accountServiceApiPath";
import LedgerEnum from "../../enum/ENUMAccountHeads";
import { ENUMBudgetType } from "../../enum/ENUMBudgetType";
import { ENUMJournalType } from "../../enum/ENUMJournalTYpe";

export type IJournalEntry = {
  account: string;
  comment?: string;
  debit: number;
  credit: number;
  memo: string;
  journalType: string;
  budgetType: string;
};

export const postAdmissionJournalEntry = async ({
  orderAmount,
  paid,
  due,
  token,
}: {
  orderAmount: number;
  paid: number;
  due: number;
  token: string;
}) => {
  const journalEntry: IJournalEntry[] = [
    {
      account: LedgerEnum.Service_Income_Indoor,
      credit: orderAmount,
      debit: 0,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Patient Admitted",
    },
  ];

  if (paid) {
    journalEntry.unshift({
      account: LedgerEnum.CashInHand,
      credit: 0,
      debit: paid,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Patient Admitted",
    });
  }
  if (due) {
    journalEntry.unshift({
      account: LedgerEnum.AccountsReceivable,
      credit: 0,
      debit: due,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Patient Admitted",
    });
  }

  const result = await AccountService.post(
    Account_Service_Api_Path.JOURNAL,
    journalEntry,
    {
      headers: {
        Authorization: token,
      },
    }
  );
  return result;
};

const postJournalEntryForDueCollection = async ({
  amount,
  token,
}: {
  token: string;
  amount: number;
}) => {
  const journalEntry: IJournalEntry[] = [
    {
      account: LedgerEnum.CashInHand,
      credit: 0,
      debit: amount,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Due collected Indoor Patient",
    },
    {
      account: LedgerEnum.AccountsReceivable,
      credit: amount,
      debit: 0,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Due collected Indoor Patient",
    },
  ];

  const result = await AccountService.post(
    Account_Service_Api_Path.JOURNAL,
    journalEntry,
    {
      headers: {
        Authorization: token,
      },
    }
  );
  return result;
};

const postJournalEntryForBedTransfer = async ({
  amount,
  token,
}: {
  token: string;
  amount: number;
}) => {
  const journalEntry: IJournalEntry[] = [
    {
      account: LedgerEnum.AccountsReceivable,
      credit: 0,
      debit: amount,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Amount for bed Transfer",
    },
    {
      account: LedgerEnum.Service_Income_Indoor,
      credit: amount,
      debit: 0,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "Amount for bed Transfer",
    },
  ];

  const result = await AccountService.post(
    Account_Service_Api_Path.JOURNAL,
    journalEntry,
    {
      headers: {
        Authorization: token,
      },
    }
  );
  return result;
};

const postJournalEntryForServiceAdd = async ({
  amount,
  token,
}: {
  token: string;
  amount: number;
}) => {
  const journalEntry: IJournalEntry[] = [
    {
      account: LedgerEnum.AccountsReceivable,
      credit: 0,
      debit: amount,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "TO record Added service to the Admitted patient",
    },
    {
      account: LedgerEnum.Service_Income_Indoor,
      credit: amount,
      debit: 0,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "TO record Added service to the Admitted patient",
    },
  ];

  const result = await AccountService.post(
    Account_Service_Api_Path.JOURNAL,
    journalEntry,
    {
      headers: {
        Authorization: token,
      },
    }
  );
  return result;
};
const postJournalEntryForDoctorCommission = async ({
  amount,
  token,
}: {
  token: string;
  amount: number;
}) => {
  const journalEntry: IJournalEntry[] = [
    {
      account: LedgerEnum.CommissionExpense,
      credit: 0,
      debit: amount,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "To record Doctors Commission payable for test ",
    },
    {
      account: LedgerEnum.CommissionPayable,
      credit: amount,
      debit: 0,
      journalType: ENUMJournalType.GENERAL,
      budgetType: ENUMBudgetType.REGULAR,
      memo: "To record Doctors Commission payable for test",
    },
  ];

  const result = await AccountService.post(
    Account_Service_Api_Path.JOURNAL,
    journalEntry,
    {
      headers: {
        Authorization: token,
      },
    }
  );
  return result;
};
export const journalEntryService = {
  postAdmissionJournalEntry,
  postJournalEntryForDueCollection,
  postJournalEntryForDoctorCommission,
  postJournalEntryForBedTransfer,
  postJournalEntryForServiceAdd,
};
