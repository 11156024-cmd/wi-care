import React, { useState, useRef } from 'react';
import { 
  FolderUp, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Loader
} from 'lucide-react';

interface FileWithPath {
  file: File;
  path: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FolderUploadProps {
  onUploadComplete?: (files: FileWithPath[]) => void;
  onUploadError?: (error: string) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
}

export const FolderUpload: React.FC<FolderUploadProps> = ({
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = '*',
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: FileWithPath[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} exceeds max size of ${maxFileSize} bytes`);
        continue;
      }

      fileList.push({
        file,
        path: file.webkitRelativePath || file.name,
        status: 'pending'
      });
    }

    setSelectedFiles(fileList);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      selectedFiles.forEach((fileWithPath, index) => {
        formData.append('files', fileWithPath.file);
        formData.append(`paths[${index}]`, fileWithPath.path);
      });

      // Update file statuses to uploading
      setSelectedFiles(prev => 
        prev.map(f => ({ ...f, status: 'uploading' as const }))
      );

      // Simulate upload progress (replace with actual upload logic)
      const response = await fetch('/api/upload/folder', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update file statuses to success
      setSelectedFiles(prev => 
        prev.map(f => ({ ...f, status: 'success' as const }))
      );

      setUploadProgress(100);

      if (onUploadComplete) {
        onUploadComplete(selectedFiles);
      }

      // Clear files after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file statuses to error
      setSelectedFiles(prev => 
        prev.map(f => ({ 
          ...f, 
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );

      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Upload failed');
      }

      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="folder-upload-container">
      {/* Upload Area */}
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is not in standard TypeScript definitions
          {...({ webkitdirectory: "", directory: "" } as any)}
          multiple
          onChange={handleFolderSelect}
          style={{ display: 'none' }}
          accept={acceptedFileTypes}
        />
        
        <button
          className="upload-trigger-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <FolderUp className="w-6 h-6" />
          <span className="upload-text">選擇資料夾</span>
          <span className="upload-hint">點擊以選擇要上傳的資料夾</span>
        </button>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="file-list-container">
          <div className="file-list-header">
            <h4 className="file-list-title">
              已選擇 {selectedFiles.length} 個檔案
            </h4>
            <button
              className="clear-btn"
              onClick={handleClear}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
              清除
            </button>
          </div>

          <div className="file-list">
            {selectedFiles.map((fileWithPath, index) => (
              <div key={index} className="file-item">
                <div className="file-icon">
                  {getFileIcon(fileWithPath.status)}
                </div>
                <div className="file-info">
                  <div className="file-name">{fileWithPath.path}</div>
                  <div className="file-size">{formatFileSize(fileWithPath.file.size)}</div>
                  {fileWithPath.error && (
                    <div className="file-error">{fileWithPath.error}</div>
                  )}
                </div>
                {!isUploading && fileWithPath.status === 'pending' && (
                  <button
                    className="remove-file-btn"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">{uploadProgress}%</div>
            </div>
          )}

          {/* Upload Button */}
          <div className="upload-actions">
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  上傳資料夾
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .folder-upload-container {
          width: 100%;
        }

        .upload-area {
          width: 100%;
          padding: 2rem;
          border: 2px dashed #cbd5e1;
          border-radius: 1rem;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .upload-area:hover {
          border-color: #0ea5e9;
          background: #f0f9ff;
        }

        .upload-trigger-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }

        .upload-trigger-btn:hover {
          color: #0ea5e9;
        }

        .upload-trigger-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .file-list-container {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .file-list-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .clear-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          background: #f1f5f9;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-list {
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .file-item:hover {
          background: #f1f5f9;
        }

        .file-icon {
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.125rem;
        }

        .file-error {
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 0.125rem;
        }

        .remove-file-btn {
          flex-shrink: 0;
          padding: 0.375rem;
          background: transparent;
          border: none;
          border-radius: 0.25rem;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-file-btn:hover {
          background: #e2e8f0;
          color: #ef4444;
        }

        .upload-progress {
          margin-top: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 0.5rem;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #0ea5e9, #06b6d4);
          transition: width 0.3s;
        }

        .progress-text {
          text-align: center;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .upload-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(to right, #0ea5e9, #06b6d4);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: linear-gradient(to right, #0284c7, #0891b2);
        }

        .upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FolderUpload;
