import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, InputNumber, Button, Form, Space, Divider } from 'antd';
import { EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext'; // Import your auth context
import { Select } from 'antd';
const { Option } = Select;

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface InvoiceData {
    filename: string;
    processedData: {
        choices: [{
            message: {
                function_call: {
                    arguments: string;
                }
            }
        }]
    };
}

// Add new interfaces
interface SupplierInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
}

interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
}

interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

// Add this function before the components
const parseInvoiceData = (rawData: string) => {
    try {
        const data = JSON.parse(rawData);
        return {
            invoiceNumber: data.invoiceNumber || '',
            date: data.date || '',
            dueDate: data.dueDate || '',
            total: data.total || 0,
            subtotal: data.subtotal || 0,
            tax: data.tax || 0,
            supplierInfo: {
                name: data.supplierName || '',
                email: data.supplierEmail || '',
                phone: data.supplierPhone || '',
                address: data.supplierAddress || '',
            },
            customerInfo: {
                name: data.customerName || '',
                email: data.customerEmail || '',
                phone: data.customerPhone || '',
                address: data.customerAddress || '',
            },
            items: data.items?.map((item: any) => ({
                description: item.description || '',
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                amount: item.amount || 0
            })) || []
        };
    } catch (error) {
        console.error('Error parsing invoice data:', error);
        return {
            invoiceNumber: '',
            date: '',
            dueDate: '',
            total: 0,
            subtotal: 0,
            tax: 0,
            supplierInfo: { name: '', email: '', phone: '', address: '' },
            customerInfo: { name: '', email: '', phone: '', address: '' },
            items: []
        };
    }
};

// Create a separate component for the invoice card
const InvoiceCard: React.FC<{
    invoice: InvoiceData;
    isEditing: boolean;
    isSaving: boolean;
    suppliers: Supplier[];
    loadingSuppliers: boolean;
    onSave: (filename: string) => void;
    onEdit: (filename: string) => void;
    onDelete: (filename: string) => void;
}> = ({ invoice, isEditing, isSaving, suppliers, loadingSuppliers, onSave, onEdit, onDelete }) => {
    const [form] = Form.useForm();
    
    let invoiceData;
    try {
        const rawData = invoice.processedData.choices[0].message.function_call.arguments;
        invoiceData = parseInvoiceData(rawData);
        console.log('Parsed invoice data:', invoiceData); // Debug
    } catch (error) {
        console.error('Error parsing invoice:', error);
        invoiceData = parseInvoiceData('{}');
    }

    return (
        <Card
            key={invoice.filename}
            title={<div className="font-bold">{invoice.filename}</div>}
            extra={
                <Space>
                    {isEditing ? (
                        <Button 
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={isSaving}
                            onClick={() => onSave(invoice.filename)}
                        >
                            Save
                        </Button>
                    ) : (
                        <Button 
                            icon={<EditOutlined />}
                            onClick={() => onEdit(invoice.filename)}
                        >
                            Edit
                        </Button>
                    )}
                    <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(invoice.filename)}
                        disabled={isSaving}
                    >
                        Delete
                    </Button>
                </Space>
            }
            className="shadow-lg"
        >
            <Form
                form={form}
                name={invoice.filename}
                layout="vertical"
                initialValues={invoiceData}
            >
                <Form.Item label="Select Existing Supplier">
                    <Select
                        loading={loadingSuppliers}
                        disabled={!isEditing}
                        placeholder="Select a supplier"
                        onChange={(value) => handleSupplierSelect(value, form)}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {suppliers.map(supplier => (
                            <Option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Divider>Invoice Details</Divider>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Invoice Number" name="invoiceNumber">
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Date" name="date">
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Due Date" name="dueDate">
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Total" name="total">
                        <InputNumber 
                            disabled={!isEditing} 
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                </div>

                <Divider>Supplier Information</Divider>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Name" name={['supplierInfo', 'name']}>
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Email" name={['supplierInfo', 'email']}>
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Phone" name={['supplierInfo', 'phone']}>
                        <Input disabled={!isEditing} />
                    </Form.Item>
                    <Form.Item label="Address" name={['supplierInfo', 'address']}>
                        <Input.TextArea disabled={!isEditing} />
                    </Form.Item>
                </div>

                <Divider>Items</Divider>
                <Form.List name="items">
                    {(fields) => (
                        <div className="space-y-4">
                            {fields.map(({ key, name }) => (
                                <div key={key} className="grid grid-cols-4 gap-4">
                                    <Form.Item
                                        name={[name, 'description']}
                                        label="Description"
                                    >
                                        <Input disabled={!isEditing} />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, 'quantity']}
                                        label="Quantity"
                                    >
                                        <InputNumber 
                                            disabled={!isEditing}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, 'unitPrice']}
                                        label="Unit Price"
                                    >
                                        <InputNumber
                                            disabled={!isEditing}
                                            style={{ width: '100%' }}
                                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, 'amount']}
                                        label="Amount"
                                    >
                                        <InputNumber
                                            disabled={true}
                                            style={{ width: '100%' }}
                                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </div>
                            ))}
                        </div>
                    )}
                </Form.List>

                

                <Divider>Additional Details</Divider>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Subtotal" name="subtotal">
                        <InputNumber
                            disabled={true}
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                    <Form.Item label="Tax" name="tax">
                        <InputNumber
                            disabled={!isEditing}
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                </div>
            </Form>
        </Card>
    );
};

// Main component
const InvoiceReview: React.FC = () => {
    const { token } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    // Add supplier fetching
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoadingSuppliers(true);
                const response = await fetch('http://localhost:3001/api/suppliers', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to fetch suppliers');
                
                const data = await response.json();
                setSuppliers(data.suppliers);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                message.error('Failed to load suppliers');
            } finally {
                setLoadingSuppliers(false);
            }
        };

        fetchSuppliers();
    }, [token]);

    useEffect(() => {
        const storedInvoices = localStorage.getItem('pendingInvoices');
        if (storedInvoices) {
            const parsedInvoices = JSON.parse(storedInvoices);
            console.log('Raw stored invoices:', parsedInvoices);
            setInvoices(parsedInvoices);
        }
    }, []);

    return (
        <div className="p-6">
            <div className="flex flex-col gap-6">
                {invoices.map((invoice) => (
                    <InvoiceCard
                        key={invoice.filename}
                        invoice={invoice}
                        isEditing={editMode[invoice.filename]}
                        isSaving={loading[invoice.filename]}
                        suppliers={suppliers}
                        loadingSuppliers={loadingSuppliers}
                        onSave={(filename) => handleSave(filename)}
                        onEdit={(filename) => toggleEditMode(filename)}
                        onDelete={(filename) => handleDelete(filename)}
                    />
                ))}
            </div>
        </div>
    );
};

export default InvoiceReview;
