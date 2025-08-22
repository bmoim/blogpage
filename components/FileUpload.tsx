
import React from 'react';
import type { ChangeEvent, RefObject } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  file: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
}

const FileUpload: React.FC<FileUploadProps> = ({ file, onFileChange, fileInputRef }) => {
  return (
    <div>
      <p className="text-center text-gray-400 mb-4">'topic' 열이 포함된 CSV 파일을 업로드하세요.</p>
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <Icon name="upload" className="w-10 h-10 mb-3 text-gray-400" />
            {file ? (
                <>
                    <p className="font-semibold text-purple-300">{file.name}</p>
                    <p className="text-xs text-gray-500">파일을 변경하려면 여기를 클릭하세요.</p>
                </>
            ) : (
                <>
                    <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-purple-400">클릭하여 업로드</span> 또는 파일을 드래그하세요.
                    </p>
                    <p className="text-xs text-gray-500">CSV (최대 5MB)</p>
                </>
            )}
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".csv"
          onChange={onFileChange}
          ref={fileInputRef}
        />
      </label>
    </div>
  );
};

export default FileUpload;
