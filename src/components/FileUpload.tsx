// After successful processing of invoices
const handleUploadSuccess = (processedInvoices: InvoiceData[]) => {
  localStorage.setItem('pendingInvoices', JSON.stringify(processedInvoices));
  navigate('/review'); // Redirect to review page
};
