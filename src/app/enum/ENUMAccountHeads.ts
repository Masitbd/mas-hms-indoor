/* eslint-disable no-unused-vars */
// LedgerEnum.ts
export enum LedgerEnum {
  // Fixed Assets
  Land = "67d2710bb69308135eabdfa3",
  Building = "67d2712d8266df318ddb8e67",
  Machinery = "67d27143b69308135eabdfa9",
  Vehicles = "67d27163cde03d915ebdf9b2",
  FurnitureAndFixtures = "67d27185cde03d915ebdf9b6",
  Equipment = "67d271978266df318ddb8e71",

  // Current Assets
  CashInHand = "67d271b4cde03d915ebdf9bc",
  CashAtBank = "67d271ccb69308135eabdfb5",
  AccountsReceivable = "67d271eacde03d915ebdf9c2",
  Inventory = "67d27203b69308135eabdfbb",
  PrepaidExpenses = "67d2721ecde03d915ebdf9c8",
  ShortTermInvestments = "67d2723ab69308135eabdfc1",

  // Other Assets
  LongTermInvestments = "67d27259b69308135eabdfc5",
  Goodwill = "67d2726fb69308135eabdfc9",
  PatentsAndTrademarks = "67d27286cde03d915ebdf9d2",

  // Current Liabilities
  AccountsPayable = "67d272b9b69308135eabdfd1",
  ShortTermLoans = "67d272d1cde03d915ebdf9d8",
  OutstandingExpenses = "67d272e7b69308135eabdfd7",
  TaxesPayable = "67d272fdb69308135eabdfdb",

  // Long-term Liabilities
  LongTermLoans = "67d273188266df318ddb8e8f",
  BondsPayable = "67d2732fb69308135eabdfe1",
  DeferredTaxLiabilities = "67d27345b69308135eabdfe5",

  // Capital
  OwnersCapital = "67d27390cde03d915ebdf9e8",
  ShareCapital = "67d273a5b69308135eabdfeb",
  RetainedEarnings = "67d273b5cde03d915ebdf9ee",
  ReservesAndSurplus = "67d273c6b69308135eabdff1",
  Drawings = "67d273dbcde03d915ebdf9f4",

  // Income
  SalesRevenue = "67d27405b69308135eabdff9",
  ServiceIncome = "67d274188266df318ddb8ea3",
  RentalIncome = "67d27427b69308135eabdfff",
  InterestIncome = "67d274378266df318ddb8ea9",
  DividendIncome = "67d27447b69308135eabe005",
  CommissionIncome = "67d274568266df318ddb8eaf",
  OtherOperatingIncome = "67d27467b69308135eabe00b",
  Service_Income_Indoor = "680549da2e479947918674a2",
  Service_Income_Diagonestic = "68054a0e2e479947918674aa",

  // Operating Expenses
  SalariesAndWages = "67d274828266df318ddb8eb7",
  RentAndUtilities = "67d27495cde03d915ebdfa08",
  OfficeSupplies = "67d274a88266df318ddb8ebd",
  RepairsAndMaintenance = "67d274bb8266df318ddb8ec3",
  AdvertisingAndMarketing = "67d274cdcde03d915ebdfa0e",
  TravelAndEntertainment = "67d274e08266df318ddb8ec9",
  InsuranceExpense = "67d274f1cde03d915ebdfa14",
  SalesDiscount = "67f5fccfc97c16d2a6624c46",

  // Production Expenses
  RawMaterialCost = "67d275068266df318ddb8ecf",
  DirectLaborCost = "67d2751ccde03d915ebdfa1a",
  FactoryOverhead = "67d2752d8266df318ddb8ed5",

  // Financial Expenses
  InterestExpense = "67d27542b69308135eabe023",
  BankCharges = "67d27554cde03d915ebdfa22",

  // Depreciation & Amortization
  DepreciationExpense = "67d27afde2c59c29c3e6341f",
  AmortizationExpense = "67d27bd39e825cd7f4b54ed9",

  // Taxes
  VAT = "67d27c449e825cd7f4b54ee3",

  CommissionPayable = "67f6d41af358180b7c20f616",
  CommissionExpense = "67f6d407f358180b7c20f60e",
}

export default LedgerEnum;
