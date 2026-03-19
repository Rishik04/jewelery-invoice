export interface BankDetails {
  _id: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifsc: string;
}

export interface Address {
  _id: string;
  street: string;
  city: string;
  landmark?: string;
  state: string;
  statecode?: string;
  pincode: number;
}

export interface Company {
  _id: string;
  name: string;
  address: Address;
  gstin: string;
  hallMarkNumber: string;
  email: string;
  phone: string[];
  bank: BankDetails;
  termsConditions: string[];
}