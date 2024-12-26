import React, { useState } from 'react';
import { FiUpload, FiX, FiSettings, FiPlay } from 'react-icons/fi';
import { invoiceApi } from '../../api/api';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  file: File;
  progress: number;
  size: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  processingMessage?: string;
}

const Upload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (uploadedFiles.length + files.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      progress: 0,
      size: formatFileSize(file.size),
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const files = uploadedFiles.map(uf => uf.file);
      
      // First phase: Upload files
      const uploadResponse = await invoiceApi.upload(files, (progress) => {
        setUploadedFiles(prev => prev.map(file => ({
          ...file,
          progress: progress / 2,
          status: 'uploading',
          processingMessage: 'Uploading...'
        })));
      });

      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        progress: 50,
        status: 'processing',
        processingMessage: 'Processing with AI...'
      })));

      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(file => ({
          ...file,
          progress: Math.min(file.progress + 5, 90)
        })));
      }, 1000);

      const processResponse = await invoiceApi.process(files);
      
      clearInterval(progressInterval);

      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        progress: 100,
        status: 'completed',
        processingMessage: 'Completed!'
      })));

      if (processResponse.data) {
        localStorage.setItem('pendingInvoices', JSON.stringify(processResponse.data.data));
        // Navigate to review page with the processed data
        navigate('/review', { 
          state: { 
            invoices: processResponse.data 
          }
        });
      }

    } catch (error) {
      console.error('Upload/Processing failed:', error);
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        processingMessage: 'Error occurred'
      })));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="border-2 border-dashed border-emerald-500 rounded-lg p-8 bg-emerald-50 text-center">
        <div className="flex flex-col items-center gap-4">
          <FiUpload className="w-12 h-12 text-emerald-500" />
          <p className="text-emerald-700">File added! Start task or add more files</p>
          <div className="flex gap-3">
            <div className="relative">
              <button className="btn bg-white text-gray-700 px-4 py-2 rounded flex items-center gap-2">
                <FiUpload /> Add more files
              </button>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <button className="btn bg-white text-gray-700 px-4 py-2 rounded flex items-center gap-2">
              <FiSettings /> Settings
            </button>
            <button 
              onClick={handleStartUpload}
              disabled={isUploading || uploadedFiles.length === 0}
              className={`btn ${isUploading ? 'bg-blue-400' : 'bg-blue-600'} text-white px-6 py-2 rounded flex items-center gap-2`}
            >
              {isUploading ? 'UPLOADING...' : 'START'} <FiPlay />
            </button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="mt-6">
        {uploadedFiles.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-700">{file.file.name}</span>
              <span className="text-gray-500 text-sm">{file.size}</span>
              {file.processingMessage && (
                <span className={`text-sm ${
                  file.status === 'error' ? 'text-red-500' : 
                  file.status === 'completed' ? 'text-green-500' : 
                  'text-blue-500'
                }`}>
                  {file.processingMessage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {file.status !== 'pending' && (
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      file.status === 'error' ? 'bg-red-500' : 
                      file.status === 'completed' ? 'bg-green-500' : 
                      file.status === 'processing' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              )}
              {!isUploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Upload;
