"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEnum = void 0;
/* eslint-disable no-unused-vars */
// LedgerEnum.ts
var LedgerEnum;
(function (LedgerEnum) {
    // Fixed Assets
    LedgerEnum["Land"] = "67d2710bb69308135eabdfa3";
    LedgerEnum["Building"] = "67d2712d8266df318ddb8e67";
    LedgerEnum["Machinery"] = "67d27143b69308135eabdfa9";
    LedgerEnum["Vehicles"] = "67d27163cde03d915ebdf9b2";
    LedgerEnum["FurnitureAndFixtures"] = "67d27185cde03d915ebdf9b6";
    LedgerEnum["Equipment"] = "67d271978266df318ddb8e71";
    // Current Assets
    LedgerEnum["CashInHand"] = "67d271b4cde03d915ebdf9bc";
    LedgerEnum["CashAtBank"] = "67d271ccb69308135eabdfb5";
    LedgerEnum["AccountsReceivable"] = "67d271eacde03d915ebdf9c2";
    LedgerEnum["Inventory"] = "67d27203b69308135eabdfbb";
    LedgerEnum["PrepaidExpenses"] = "67d2721ecde03d915ebdf9c8";
    LedgerEnum["ShortTermInvestments"] = "67d2723ab69308135eabdfc1";
    // Other Assets
    LedgerEnum["LongTermInvestments"] = "67d27259b69308135eabdfc5";
    LedgerEnum["Goodwill"] = "67d2726fb69308135eabdfc9";
    LedgerEnum["PatentsAndTrademarks"] = "67d27286cde03d915ebdf9d2";
    // Current Liabilities
    LedgerEnum["AccountsPayable"] = "67d272b9b69308135eabdfd1";
    LedgerEnum["ShortTermLoans"] = "67d272d1cde03d915ebdf9d8";
    LedgerEnum["OutstandingExpenses"] = "67d272e7b69308135eabdfd7";
    LedgerEnum["TaxesPayable"] = "67d272fdb69308135eabdfdb";
    // Long-term Liabilities
    LedgerEnum["LongTermLoans"] = "67d273188266df318ddb8e8f";
    LedgerEnum["BondsPayable"] = "67d2732fb69308135eabdfe1";
    LedgerEnum["DeferredTaxLiabilities"] = "67d27345b69308135eabdfe5";
    // Capital
    LedgerEnum["OwnersCapital"] = "67d27390cde03d915ebdf9e8";
    LedgerEnum["ShareCapital"] = "67d273a5b69308135eabdfeb";
    LedgerEnum["RetainedEarnings"] = "67d273b5cde03d915ebdf9ee";
    LedgerEnum["ReservesAndSurplus"] = "67d273c6b69308135eabdff1";
    LedgerEnum["Drawings"] = "67d273dbcde03d915ebdf9f4";
    // Income
    LedgerEnum["SalesRevenue"] = "67d27405b69308135eabdff9";
    LedgerEnum["ServiceIncome"] = "67d274188266df318ddb8ea3";
    LedgerEnum["RentalIncome"] = "67d27427b69308135eabdfff";
    LedgerEnum["InterestIncome"] = "67d274378266df318ddb8ea9";
    LedgerEnum["DividendIncome"] = "67d27447b69308135eabe005";
    LedgerEnum["CommissionIncome"] = "67d274568266df318ddb8eaf";
    LedgerEnum["OtherOperatingIncome"] = "67d27467b69308135eabe00b";
    LedgerEnum["Service_Income_Indoor"] = "680549da2e479947918674a2";
    LedgerEnum["Service_Income_Diagonestic"] = "68054a0e2e479947918674aa";
    // Operating Expenses
    LedgerEnum["SalariesAndWages"] = "67d274828266df318ddb8eb7";
    LedgerEnum["RentAndUtilities"] = "67d27495cde03d915ebdfa08";
    LedgerEnum["OfficeSupplies"] = "67d274a88266df318ddb8ebd";
    LedgerEnum["RepairsAndMaintenance"] = "67d274bb8266df318ddb8ec3";
    LedgerEnum["AdvertisingAndMarketing"] = "67d274cdcde03d915ebdfa0e";
    LedgerEnum["TravelAndEntertainment"] = "67d274e08266df318ddb8ec9";
    LedgerEnum["InsuranceExpense"] = "67d274f1cde03d915ebdfa14";
    LedgerEnum["SalesDiscount"] = "67f5fccfc97c16d2a6624c46";
    // Production Expenses
    LedgerEnum["RawMaterialCost"] = "67d275068266df318ddb8ecf";
    LedgerEnum["DirectLaborCost"] = "67d2751ccde03d915ebdfa1a";
    LedgerEnum["FactoryOverhead"] = "67d2752d8266df318ddb8ed5";
    // Financial Expenses
    LedgerEnum["InterestExpense"] = "67d27542b69308135eabe023";
    LedgerEnum["BankCharges"] = "67d27554cde03d915ebdfa22";
    // Depreciation & Amortization
    LedgerEnum["DepreciationExpense"] = "67d27afde2c59c29c3e6341f";
    LedgerEnum["AmortizationExpense"] = "67d27bd39e825cd7f4b54ed9";
    // Taxes
    LedgerEnum["VAT"] = "67d27c449e825cd7f4b54ee3";
    LedgerEnum["CommissionPayable"] = "67f6d41af358180b7c20f616";
    LedgerEnum["CommissionExpense"] = "67f6d407f358180b7c20f60e";
})(LedgerEnum || (exports.LedgerEnum = LedgerEnum = {}));
exports.default = LedgerEnum;
