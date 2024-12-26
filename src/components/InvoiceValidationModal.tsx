import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Invoice } from '../types/invoice';

interface InvoiceValidationModalProps {
  invoices: Invoice[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onSave: (invoice: Invoice) => Promise<void>;
  isProcessing?: boolean;
  processingStatus?: string;
}

const InputField = React.memo(({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      className="w-full p-1.5 border rounded bg-gray-700 border-gray-600 text-white text-sm"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
    />
  </div>
));

const SelectField = React.memo(({ label, value, onChange, options }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <select
      className="w-full p-1.5 border rounded bg-gray-700 border-gray-600 text-white text-sm"
      value={value}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
));

const InvoiceValidationModal: React.FC<InvoiceValidationModalProps> = ({
  invoices,
  currentIndex,
  onIndexChange,
  onClose,
  onSave,
  isProcessing,
  processingStatus
}) => {
  const [editedInvoice, setEditedInvoice] = useState<Invoice>(() => ({
    ...invoices[currentIndex],
    invoice_number: invoices[currentIndex]?.invoice_number || '',
    date: invoices[currentIndex]?.date || '',
    due_date: invoices[currentIndex]?.due_date || '',
    vendor: {
      name: invoices[currentIndex]?.vendor?.name || '',
      address: invoices[currentIndex]?.vendor?.address || '',
      tax_id: invoices[currentIndex]?.vendor?.tax_id || ''
    },
    items: invoices[currentIndex]?.items || [],
    total_amount: invoices[currentIndex]?.total_amount || 0,
    currency: invoices[currentIndex]?.currency || 'USD',
    status: invoices[currentIndex]?.status || 'pending'
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setEditedInvoice({
      ...invoices[currentIndex],
      invoice_number: invoices[currentIndex]?.invoice_number || '',
      date: invoices[currentIndex]?.date || '',
      due_date: invoices[currentIndex]?.due_date || '',
      vendor: {
        name: invoices[currentIndex]?.vendor?.name || '',
        address: invoices[currentIndex]?.vendor?.address || '',
        tax_id: invoices[currentIndex]?.vendor?.tax_id || ''
      },
      items: invoices[currentIndex]?.items || [],
      total_amount: invoices[currentIndex]?.total_amount || 0,
      currency: invoices[currentIndex]?.currency || 'USD',
      status: invoices[currentIndex]?.status || 'pending'
    });
  }, [currentIndex, invoices]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    setEditedInvoice(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const handleVendorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setEditedInvoice(prev => ({
      ...prev,
      vendor: {
        ...prev.vendor,
        [field]: e.target.value
      }
    }));
  }, []);

  const handleItemChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number, field: string) => {
    setEditedInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: e.target.value } : item
      )
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      await onSave(editedInvoice);
      
      clearInterval(interval);
      setUploadProgress(100);

      if (currentIndex < invoices.length - 1) {
        onIndexChange(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const memoizedContent = useMemo(() => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-white">Invoice Details</h3>
          <InputField
            label="Invoice Number"
            value={editedInvoice.invoice_number}
            onChange={(e) => handleInputChange(e, 'invoice_number')}
            placeholder="Invoice Number"
          />
          <InputField
            label="Date"
            value={editedInvoice.date}
            onChange={(e) => handleInputChange(e, 'date')}
            type="date"
          />
          <InputField
            label="Due Date"
            value={editedInvoice.due_date}
            onChange={(e) => handleInputChange(e, 'due_date')}
            type="date"
          />
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-white">Vendor Information</h3>
          <InputField
            label="Vendor Name"
            value={editedInvoice.vendor.name}
            onChange={(e) => handleVendorChange(e, 'name')}
            placeholder="Vendor Name"
          />
          <InputField
            label="Vendor Address"
            value={editedInvoice.vendor.address}
            onChange={(e) => handleVendorChange(e, 'address')}
            placeholder="Vendor Address"
          />
          <InputField
            label="Tax ID"
            value={editedInvoice.vendor.tax_id}
            onChange={(e) => handleVendorChange(e, 'tax_id')}
            placeholder="Tax ID"
          />
        </div>
      </div>

      {/* Items Table */}
      <div>
        <h3 className="font-semibold mb-3 text-white">Invoice Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white">Description</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white">Quantity</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600 bg-gray-800">
              {editedInvoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <input
                      className="w-full p-1 border rounded bg-gray-700 border-gray-600 text-white text-xs"
                      value={item.description}
                      onChange={(e) => handleItemChange(e, index, 'description')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full p-1 border rounded text-right bg-gray-700 border-gray-600 text-white text-xs"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(e, index, 'quantity')}
                      type="number"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full p-1 border rounded text-right bg-gray-700 border-gray-600 text-white text-xs"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(e, index, 'unit_price')}
                      type="number"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full p-1 border rounded text-right bg-gray-700 border-gray-600 text-white text-xs"
                      value={item.total}
                      onChange={(e) => handleItemChange(e, index, 'total')}
                      type="number"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ), [editedInvoice, handleInputChange, handleVendorChange, handleItemChange]);

  const renderProcessingStatus = () => {
    if (!isProcessing) return null;
    
    return (
      <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-white">{processingStatus}</span>
        </div>
        {uploadProgress > 0 && (
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-4/5 max-w-4xl my-6 max-h-[90vh] overflow-y-auto">
        {renderProcessingStatus()} {/* Add this line */}
        <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">Invoice {currentIndex + 1} of {invoices.length}</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => onIndexChange(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onIndexChange(currentIndex + 1)}
                disabled={currentIndex === invoices.length - 1}
                className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white text-2xl">&times;</button>
        </div>

        {memoizedContent}

        <div className="sticky bottom-0 flex justify-end space-x-4 p-4 border-t border-gray-700 bg-gray-800">
          <button
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceValidationModal;
