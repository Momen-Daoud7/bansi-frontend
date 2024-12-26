import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types/invoice';
import { fetchInvoiceDetailsFromAirtable } from '../../utils/airtableService';

interface InvoiceDetailsProps {
  invoiceId: string;
  onClose: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const fetchedInvoice = await fetchInvoiceDetailsFromAirtable(invoiceId);
        setInvoice(fetchedInvoice);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  if (isLoading) {
    return <div>Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div>Error loading invoice details.</div>;
  }

  return (
    <div
      className="modal-container fixed z-50 flex top-25 bottom-5"
      onClick={(e) => {
        if ((e.target as HTMLElement).className.includes("modal-container")) onClose();
      }}
    >
      <div className="modal rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-auto">
        <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
          <div className="w-full flex justify-end">
            <strong className="text-xl align-center cursor-pointer" onClick={onClose}>
              &times;
            </strong>
          </div>
          <h2 className="text-2xl font-bold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold">Invoice Information</h3>
              <p>Number: {invoice.invoice.invoice_number}</p>
              <p>Date: {invoice.invoice.date}</p>
              <p>Total Amount: ${invoice.invoice.total_amount.toFixed(2)}</p>
              <p>VAT Amount: ${invoice.invoice.vat_amount.toFixed(2)}</p>
              <p>Status: {invoice.invoice.status}</p>
            </div>
            <div>
              <h3 className="font-semibold">Supplier</h3>
              <p>Name: {invoice.supplier.name}</p>
              <h3 className="font-semibold mt-4">Customer</h3>
              <p>Name: {invoice.customer.name}</p>
            </div>
          </div>
          <h3 className="font-semibold mb-2">Invoice Items</h3>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Item Name
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Item Code
                  </th>
                  <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                    Quantity
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Unit Price
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Total Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {console.log(item)
            return (
                  <tr key={index}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{item.item_name}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{item.item_code}</p>
                    </td>
                    <td className="border-b border-[rgb(238,238,238)] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{item.quantity}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">${item.unit_price.toFixed(2)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">${item.total_price.toFixed(2)}</p>
                    </td>
                  </tr>
            )
              })}
              </tbody>
            </table>
          </div>
          <button
            className="mt-6 inline-flex items-center justify-center rounded-md border border-primary py-2 px-10 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
