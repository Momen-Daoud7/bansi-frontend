export interface Package {
  name: string;
  price: number;
  invoiceDate: string;
  status: 'Paid' | 'Unpaid' | 'Pending';
}