import React from 'react';
import { Invoice } from '../../types/invoice';

interface TableThreeItemsProps {
  invoices: Invoice[];
}

const TableThreeItems: React.FC<TableThreeItemsProps> = ({ invoices }) => {
  // Flatten all items from all invoices into a single array
  const allItems = invoices.flatMap((invoice, invoiceIndex) => 
    invoice.items.map(item => ({...item, invoiceIndex}))
  );

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 mt-6">
      <h2 className="text-2xl font-bold mb-4">Invoice Items</h2>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                Invoice
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Item Number
              </th>
              <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white">
                Description
              </th>
              <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                Quantity
              </th>
              <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                Unit Price
              </th>
              <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                Total Price
              </th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, index) => (
              <tr key={index}>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {invoices[item.invoiceIndex].invoice.invoice_number}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {item.item_code}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {item.description}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {item.quantity}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    ${item.unit_price.toFixed(2)}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    ${item.total_price.toFixed(2)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableThreeItems;