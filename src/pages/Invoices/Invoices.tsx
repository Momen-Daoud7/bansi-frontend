import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import TableThree from '../../components/Tables/TableThree';
import { Invoice } from '../../types/invoice';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { createInvoiceInAirtable, fetchInvoicesFromAirtable } from '../../utils/airtableService';
import InvoiceValidationModal from '../../components/InvoiceValidationModal';
import { invoiceApi } from '../../api/api';

const OPENAI_API_KEY = 'sk-food-Xy7uObVPoIYQp40pFdS0T3BlbkFJOZ9Tqj0n3SYlKsIkRSoD'

const Invoices: React.FC = () => {
    const [output, setOutput] = useState('');
    const [jsonOutput, setJsonOutput] = useState('');
    const [debugOutput, setDebugOutput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAirtableProcessing, setIsAirtableProcessing] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [processedInvoices, setProcessedInvoices] = useState<Invoice[]>([]);
    const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');

    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        fetchInvoices();
    }, []);

    const fetchInvoices = useCallback(async () => {
        try {
            const fetchedInvoices = await fetchInvoicesFromAirtable();
            setInvoices(fetchedInvoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setDebugOutput(`Error fetching invoices: ${error}`);
        }
    }, []);

    const processFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        if (files.length > 5) {
            setOutput('Maximum 5 files allowed');
            return;
        }

        setIsProcessing(true);
        setUploadProgress(0);
        setProcessingStatus('Uploading files...');
        
        try {
            // Upload files with progress
            const response = await invoiceApi.upload(files, (progress) => {
                setUploadProgress(progress);
            });

            setProcessingStatus('Processing invoices...');
            const processedData = response.data;
            
            // Only show modal after processing is complete
            setProcessedInvoices(processedData);
            setCurrentInvoiceIndex(0);
            setShowValidationModal(true);
        } catch (error: any) {
            setOutput('Error uploading files: ' + error.message);
        } finally {
            setIsProcessing(false);
            setUploadProgress(0);
            setProcessingStatus('');
        }
    };

    const handleSaveValidatedInvoice = async (validatedInvoice: Invoice) => {
        setIsAirtableProcessing(true);
        try {
            const airtableRecord = await createInvoiceInAirtable(validatedInvoice);
            setDebugOutput(`Invoice created in Airtable: ${airtableRecord.id}`);
            
            // Update local state
            setInvoices(prevInvoices => {
                const index = prevInvoices.findIndex(inv => inv.id === validatedInvoice.id);
                if (index !== -1) {
                    // Update existing invoice
                    return prevInvoices.map((inv, i) => i === index ? validatedInvoice : inv);
                } else {
                    // Add new invoice
                    return [...prevInvoices, validatedInvoice];
                }
            });

            setShowValidationModal(false);
        } catch (airtableError: any) {
            setDebugOutput(`Error creating invoice in Airtable: ${airtableError.message}`);
            throw airtableError;
        } finally {
            setIsAirtableProcessing(false);
        }
    };

    const processWithOpenAI = async (text: string): Promise<Invoice | null> => {
        if (!OPENAI_API_KEY) {
            throw new Error("OpenAI API key is not set. Please check your environment variables.");
        }
    
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are an AI assistant that extracts structured invoice data from text. Pay close attention to correctly identifying all required fields." },
                        { role: "user", content: `Extract the invoice data from the following text and format it according to the specified structure:\n\n${text}` }
                    ],
                    functions: [{
                        name: "extract_invoice_data",
                        description: "Extracts structured invoice data from text",
                        parameters: {
                            type: "object",
                            properties: {
                                invoice: {
                                    type: "object",
                                    properties: {
                                        invoice_number: { type: "string" },
                                        date: { type: "string" },
                                        type: { type: "string", enum: ["Incoming", "Outgoing"] },
                                        total_amount: { type: "number" },
                                        vat_amount: { type: "number" },
                                        status: { type: "string", enum: ["Paid", "Unpaid", "Partial"] },
                                        notes: { type: "string" }
                                    },
                                    required: ["invoice_number", "date", "type", "total_amount", "vat_amount", "status"]
                                },
                                supplier: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        contact_person: { type: "string" },
                                        email: { type: "string" },
                                        phone: { type: "string" },
                                        address: { type: "string" },
                                        trn: { type: "string" }
                                    },
                                    required: ["name"]
                                },
                                customer: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        contact_person: { type: "string" },
                                        email: { type: "string" },
                                        phone: { type: "string" },
                                        address: { type: "string" },
                                        trn: { type: "string" }
                                    },
                                    required: ["name"]
                                },
                                items: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            item_name: { type: "string" },
                                            item_code: { type: "string" },
                                            description: { type: "string" },
                                            quantity: { type: "number" },
                                            unit_price: { type: "number" },
                                            total_price: { type: "number" }
                                        },
                                        required: ["item_name", "quantity", "unit_price", "total_price","item_code"]
                                    }
                                }
                            },
                            required: ["invoice", "supplier", "customer", "items"]
                        }
                    }],
                    function_call: { name: "extract_invoice_data" }
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API request failed: ${response.status}. ${JSON.stringify(errorData)}`);
            }
    
            const data = await response.json();
            const functionCall = data.choices[0].message.function_call;
    
            if (functionCall && functionCall.name === "extract_invoice_data") {
                let invoice = JSON.parse(functionCall.arguments) as Invoice;
                return invoice;
            } else {
                throw new Error("Unexpected response format from OpenAI API");
            }
        } catch (error: any) {
            setDebugOutput(`Error processing with OpenAI: ${error.message}`);
            return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Breadcrumb pageName="Invoices" />
            <input 
                type="file" 
                onChange={processFiles} 
                accept=".pdf"
                multiple
                className="mb-4 p-2 border border-gray-300 rounded"
                disabled={isProcessing}
            />
            {isProcessing && <p className="text-blue-500 mb-4">Processing files... Please wait.</p>}
            <TableThree invoices={invoices} />
            {!isProcessing && showValidationModal && processedInvoices.length > 0 && (
                <InvoiceValidationModal
                    invoices={processedInvoices}
                    currentIndex={currentInvoiceIndex}
                    onIndexChange={setCurrentInvoiceIndex}
                    onClose={() => setShowValidationModal(false)}
                    onSave={handleSaveValidatedInvoice}
                    isProcessing={isProcessing}
                    processingStatus={processingStatus}
                />
            )}
        </div>
    );
};

export default Invoices;
