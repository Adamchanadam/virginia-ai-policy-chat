import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Database, Trash2, ShieldCheck, FileType } from 'lucide-react';
import { UploadedFile } from '../types';
import { saveFileToDB } from '../services/storage';
import { MAX_FILES_COUNT, MAX_FILE_SIZE_MB, MAX_TOTAL_SIZE_MB } from '../constants';

interface FileUploaderProps {
  files: UploadedFile[];
  onUploadSuccess: () => Promise<void>;
  onDeleteFile: (id: string, name: string) => Promise<void>;
  isLoading?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onUploadSuccess, onDeleteFile, isLoading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTotalSizeMB = files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);
  const sizePercentage = Math.min((currentTotalSizeMB / MAX_TOTAL_SIZE_MB) * 100, 100);

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    if (mimeType === 'text/markdown' || name.endsWith('.md')) return <FileType className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > MAX_FILES_COUNT) {
      setError(`超過檔案數量上限 (${MAX_FILES_COUNT} 個)。`);
      return;
    }

    setIsProcessing(true);
    let tempTotalSize = currentTotalSizeMB;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      let mimeType = file.type;
      if (extension === 'md') mimeType = 'text/markdown';
      else if (extension === 'txt') mimeType = 'text/plain';
      else if (extension === 'pdf') mimeType = 'application/pdf';

      if (!['application/pdf', 'text/markdown', 'text/plain'].includes(mimeType) && !['pdf', 'md', 'txt'].includes(extension || '')) {
        setError(`不支援的檔案格式 "${file.name}"。請上傳 PDF, MD 或 TXT。`);
        continue;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) { 
        setError(`"${file.name}" 超過 ${MAX_FILE_SIZE_MB}MB 限制。`);
        continue;
      }

      if (tempTotalSize + fileSizeMB > MAX_TOTAL_SIZE_MB) {
        setError(`總容量超過 ${MAX_TOTAL_SIZE_MB}MB 上限。`);
        break;
      }

      try {
        const base64 = await convertFileToBase64(file);
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          base64: base64,
          mimeType: mimeType,
        };

        await saveFileToDB(newFile);
        tempTotalSize += fileSizeMB;
      } catch (e) {
        console.error("Error saving file", e);
        setError(`儲存 "${file.name}" 失敗。`);
      }
    }

    await onUploadSuccess();
    setIsProcessing(false);
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col w-full min-h-0 relative">
      <h2 className="text-xl font-bold mb-2 flex items-center text-gray-900 flex-shrink-0">
        <Database className="w-6 h-6 mr-2 text-indigo-600" />
        知識庫文件
      </h2>
      
      {/* Usage Stats */}
      <div className="mb-2 bg-gray-50 p-3 rounded-xl border border-gray-100 flex-shrink-0">
         <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
            <span>容量: {currentTotalSizeMB.toFixed(1)}MB / {MAX_TOTAL_SIZE_MB}MB</span>
            <span>{Math.round(sizePercentage)}%</span>
         </div>
         <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${sizePercentage > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
              style={{ width: `${sizePercentage}%` }}
            ></div>
         </div>
      </div>

      {/* File List Area */}
      <div className="flex-1 overflow-y-auto mb-3 pr-2 custom-scrollbar border border-gray-100 rounded-lg bg-gray-50/50 min-h-0 relative">
        {isLoading && (
           <div className="text-center text-gray-400 py-8 animate-pulse text-base">
             正在載入知識庫...
           </div>
        )}

        {!isLoading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
            <ShieldCheck className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-base font-medium">暫無文件</p>
            <p className="text-sm mt-1">支援 PDF, MD, TXT</p>
          </div>
        )}
        
        <div className="space-y-2 p-2">
            {files.map((file) => (
            // Grid Layout: Enforces separation between content and button
            <div key={file.id} className="grid grid-cols-[1fr_auto] gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* Column 1: File Info */}
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="bg-indigo-50 p-2 rounded-lg flex-shrink-0">
                        {getFileIcon(file.mimeType, file.name)}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-base font-bold text-gray-900 truncate block w-full leading-tight" title={file.name}>
                            {file.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate mt-0.5">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                    </div>
                </div>

                {/* Column 2: Delete Button */}
                <button 
                  type="button"
                  onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDeleteFile(file.id, file.name);
                  }}
                  // Added z-20, relative, and bg-white to ensure it's not covered and looks clickable
                  className="relative z-20 p-2 text-gray-400 bg-white border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all cursor-pointer flex-shrink-0"
                  title="刪除此文件"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
            </div>
            ))}
        </div>
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg flex items-start border border-red-100 flex-shrink-0">
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-auto flex-shrink-0 pt-1">
        <input
          type="file"
          accept=".pdf,.md,.txt"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isLoading}
          className={`w-full flex items-center justify-center gap-2 text-white py-3.5 px-4 rounded-xl transition-all font-bold text-base shadow-md active:scale-[0.98] ${
            isProcessing || isLoading 
              ? 'bg-indigo-400 cursor-wait' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? '處理中...' : (
            <>
              <Upload className="w-5 h-5" />
              上傳文件 (PDF/MD/TXT)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;