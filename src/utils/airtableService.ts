import Airtable from 'airtable';
import { Invoice } from '../types/invoice';

const base = new Airtable({ apiKey: "patP2uHT6wbZclK0T.55c84ee6be642b6ed199ce70cf69fa98345fb98a39799f2486cbfa51308b1f7a" }).base("appzQQEQNgN1r5byh");

export const createInvoiceInAirtable = async (invoice: Invoice) => {
    console.log(invoice.items);
    try {
        // Check if the invoice already exists
        const existingInvoices = await base('Invoices').select({
            filterByFormula: `LOWER({Invoice Number}) = '${invoice.invoice.invoice_number.toLowerCase()}'`
        }).firstPage();

        let createdInvoice;

        if (existingInvoices.length > 0) {
            console.log('Invoice already exists in Airtable, updating...');
            createdInvoice = await base('Invoices').update([
                {
                    id: existingInvoices[0].id,
                    fields: {
                        'Invoice Number': invoice.invoice.invoice_number,
                        'Date': invoice.invoice.date,
                        'Type': invoice.invoice.type,
                        'Supplier': [await findOrCreateSupplier(invoice.supplier)],
                        'Customer': [await findOrCreateCustomer(invoice.customer)],
                        'Total Amount': invoice.invoice.total_amount,
                        'VAT Amount': invoice.invoice.vat_amount,
                        'Status': invoice.invoice.status,
                        'Notes': invoice.invoice.notes || ''
                    }
                }
            ]);
        } else {
            createdInvoice = await base('Invoices').create([
                {
                    fields: {
                        'Invoice Number': invoice.invoice.invoice_number,
                        'Date': invoice.invoice.date,
                        'Type': invoice.invoice.type,
                        'Supplier': [await findOrCreateSupplier(invoice.supplier)],
                        'Customer': [await findOrCreateCustomer(invoice.customer)],
                        'Total Amount': invoice.invoice.total_amount,
                        'VAT Amount': invoice.invoice.vat_amount,
                        'Status': invoice.invoice.status,
                        'Notes': invoice.invoice.notes || ''
                    }
                }
            ]);
        }

        // Always create or update invoice items
        await createOrUpdateInvoiceItems(createdInvoice[0].id, invoice.items, invoice);

        return createdInvoice[0];
    } catch (error) {
        console.error('Error creating/updating invoice in Airtable:', error);
        throw error;
    }
};

const findOrCreateSupplier = async (supplier: Invoice['supplier']) => {
    const suppliers = await base('Suppliers').select({
        filterByFormula: `LOWER({Supplier Name}) = '${supplier.name.toLowerCase()}'`
    }).firstPage();

    if (suppliers.length > 0) {
        return suppliers[0].id;
    } else {
        const newSupplier = await base('Suppliers').create([
            { 
                fields: { 
                    'Supplier Name': supplier.name,
                    'Contact Person': supplier.contact_person || '',
                    'Email': supplier.email || '',
                    'Phone': supplier.phone || '',
                    'Address': supplier.address || '',
                    'TRN': supplier.trn || ''
                } 
            }
        ]);
        return newSupplier[0].id;
    }
};

const findOrCreateCustomer = async (customer: Invoice['customer']) => {
    const customers = await base('Customers').select({
        filterByFormula: `LOWER({Customer Name}) = '${customer.name.toLowerCase()}'`
    }).firstPage();

    if (customers.length > 0) {
        return customers[0].id;
    } else {
        const newCustomer = await base('Customers').create([
            {
                fields: {
                    'Customer Name': customer.name,
                    'Contact Person': customer.contact_person || '',
                    'Email': customer.email || '',
                    'Phone': customer.phone || '',
                    'Address': customer.address || '',
                    'TRN': customer.trn || ''
                }
            }
        ]);
        return newCustomer[0].id;
    }
};

const createOrUpdateInvoiceItems = async (invoiceId: string, items: Invoice['items'], invoice: Invoice) => {
    console.log("Items From createOrUpdateInvoiceItems", items);
    
    // First, delete all existing items for this invoice
    const existingItems = await base('Invoice Items').select({
        filterByFormula: `{Invoice} = '${invoice.invoice.invoice_number}'`
    }).all();
    
    for (const item of existingItems) {
        await base('Invoice Items').destroy(item.id);
    }

    // Then create new items
    for (const item of items) {
        const itemRecord = await findOrCreateItem(item);
        await base('Invoice Items').create([
            {
                fields: {
                    'Invoice': invoice.invoice.invoice_number,
                    'Invoice Number': [invoiceId],
                    'Item': [itemRecord.id],
                    'Quantity': item.quantity,
                    'Unit Price': item.unit_price,
                    'Total Price': item.total_price
                }
            }
        ]);
    }
};

const findOrCreateItem = async (item: any) => {
    console.log("Item From findandcreateItem", item);
    const items = await base('Items').select({
        filterByFormula: `{Item Code} = '${item.item_code}'`
    }).firstPage();

    if (items.length > 0) {
        return items[0];
    } else {
        const newItem = await base('Items').create([
            {
                fields: {
                    'Item Name': item.item_name,
                    'Item Code': item.item_code,
                    'Description': item.description || '',
                    'Current Selling Price': item.unit_price
                }
            }
        ]);
        return newItem[0];
    }
};

export const fetchInvoicesFromAirtable = async (): Promise<Invoice[]> => {
  try {
    const records = await base('Invoices').select().all();
    return records.map(record => ({
      id: record.id,
      invoice: {
        invoice_number: record.get('Invoice Number') as string,
        date: record.get('Date') as string,
        type: record.get('Type') as string,
        total_amount: record.get('Total Amount') as number,
        vat_amount: record.get('VAT Amount') as number,
        status: record.get('Status') as string,
        notes: record.get('Notes') as string
      },
      supplier: {
        name: record.get('Supplier') as string,
        // ... other supplier fields
      },
      customer: {
        name: record.get('Customer') as string,
        // ... other customer fields
      },
      items: [] // We'll fetch items separately
    }));
  } catch (error) {
    console.error('Error fetching invoices from Airtable:', error);
    throw error;
  }
};

export const fetchInvoiceDetailsFromAirtable = async (invoiceId: string): Promise<Invoice> => {
  try {
    const record = await base('Invoices').find(invoiceId);
    const items = await base('Invoice Items').select({
      filterByFormula: `{Invoice} = '${record.get('Invoice Number')}'`
    }).all();

    return {
      id: record.id,
      invoice: {
        invoice_number: record.get('Invoice Number') as string,
        date: record.get('Date') as string,
        type: record.get('Type') as string,
        total_amount: record.get('Total Amount') as number,
        vat_amount: record.get('VAT Amount') as number,
        status: record.get('Status') as string,
        notes: record.get('Notes') as string
      },
      supplier: {
        name: record.get('Supplier Name (from Supplier)') as string,
        // ... other supplier fields
      },
      customer: {
        name: record.get('Customer Name (from Customer)') as string,
        // ... other customer fields
      },
      items: items.map(item => ({
        item_name: item.get('Item Name (from Item)') as string,
        item_code: item.get('Item Code (from Item)') as string,
        description: item.get('Description') as string,
        quantity: item.get('Quantity') as number,
        unit_price: item.get('Unit Price') as number,
        total_price: item.get('Total Price') as number
      }))
    };
  } catch (error) {
    console.error('Error fetching invoice details from Airtable:', error);
    throw error;
  }
};
