import { useState } from 'react';
import { Upload, Button, Tag, Space, Popconfirm, message as antMessage } from 'antd';
import { UploadOutlined, FileOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useFileUpload } from '../../hooks/useFileUpload';
import fileService from '../../services/fileService';

const FileCell = ({ value, candidateId, columnId, positionId, config = {}, editable = true }) => {
  const { uploadFile, deleteFile, isUploading } = useFileUpload(positionId);
  const [uploadProgress, setUploadProgress] = useState(0);

  const files = value?.files || [];

  const handleUpload = async (file) => {
    // Validate file
    const validation = fileService.validateFile(file, config);
    if (!validation.valid) {
      antMessage.error(validation.error);
      return false;
    }

    // Upload file
    uploadFile(
      {
        candidateId,
        columnId,
        file,
        onProgress: (percent) => setUploadProgress(percent),
      },
      {
        onSuccess: () => setUploadProgress(0),
        onError: () => setUploadProgress(0),
      }
    );

    return false; // Prevent default upload behavior
  };

  const handleDelete = (fileId) => {
    deleteFile(fileId);
  };

  const handleDownload = (fileUrl) => {
    fileService.download(fileUrl);
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {files.map((file) => (
        <div
          key={file.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
          }}
        >
          <Space size="small">
            <FileOutlined style={{ color: '#1890ff' }} />
            <span
              style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={file.name}
            >
              {file.name}
            </span>
            <span style={{ fontSize: 11, color: '#999' }}>
              {fileService.formatFileSize(file.size)}
            </span>
          </Space>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(file.url)}
            />
            {editable && (
              <Popconfirm
                title="Delete file?"
                onConfirm={() => handleDelete(file.id)}
                okText="Delete"
                okType="danger"
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        </div>
      ))}

      {editable && (
        <Upload beforeUpload={handleUpload} showUploadList={false} maxCount={1}>
          <Button
            icon={<UploadOutlined />}
            size="small"
            loading={isUploading}
            style={{ width: '100%' }}
          >
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
          </Button>
        </Upload>
      )}

      {config.allowedTypes && config.allowedTypes.length > 0 && (
        <div style={{ fontSize: 11, color: '#999' }}>
          Allowed: {config.allowedTypes.join(', ')}
        </div>
      )}
    </Space>
  );
};

export default FileCell;
