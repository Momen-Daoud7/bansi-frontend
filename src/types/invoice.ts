export interface Invoice {
  id: string;
  invoice: {
      invoice_number: string;
      date: string;
      type: 'Incoming' | 'Outgoing' | string;
      total_amount: number;
      vat_amount: number;
      status: 'Paid' | 'Unpaid' | 'Partial' | string;
      notes?: string;
  };
  supplier: {
      name: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      trn?: string;
  };
  customer: {
      name: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      trn?: string;
  };
  items: {
      item_name: string;
      item_code?: string;
      description?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
  }[];
}