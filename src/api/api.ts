import axios from 'axios';

const api = axios.create({
  baseURL: 'http://147.93.27.52:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
};

export const invoiceApi = {
  upload: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach(file => formData.append('invoices', file));
    
    return api.post('/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  getStatus: (id: string) => api.get(`/invoices/status/${id}`),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  process: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('invoices', file));
    
    return api.post('/invoices/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }
};

export const uploadApi = {
    upload: async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('invoices', file));
        
        const response = await fetch('/api/invoices/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    },

    process: async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('invoices', file));
        
        const response = await fetch('/api/invoices/process', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Processing failed');
        }

        return response.json();
    }
};
