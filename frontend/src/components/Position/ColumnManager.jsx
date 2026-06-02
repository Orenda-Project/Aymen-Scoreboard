import { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, List, Typography, Space, Popconfirm, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { useColumns } from '../../hooks/useColumns';

const { TextArea } = Input;
const { Title, Text } = Typography;

const COLUMN_TYPES = [
  { value: 'text', label: 'Text/Feedback', description: 'Multi-line text input for comments' },
  { value: 'date', label: 'Date', description: 'Date picker for scheduling' },
  { value: 'file', label: 'File Upload', description: 'Upload documents like resumes' },
  { value: 'percentage', label: 'Percentage', description: 'Score from 0-100%' },
  { value: 'status', label: 'Status/Dropdown', description: 'Dropdown with color-coded options' },
];

const DEFAULT_STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#d9d9d9' },
  { value: 'screening', label: 'Screening', color: '#1890ff' },
  { value: 'interview', label: 'Interview', color: '#722ed1' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#52c41a' },
  { value: 'offered', label: 'Offered', color: '#13c2c2' },
  { value: 'rejected', label: 'Rejected', color: '#ff4d4f' },
];

const ColumnManager = ({ positionId, visible, onClose }) => {
  const { columns, isLoading, addColumn, deleteColumn, isAdding, isDeleting } = useColumns(positionId);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedColumnType, setSelectedColumnType] = useState('text');

  const handleAddColumn = async (values) => {
    const columnData = {
      column_name: values.column_name,
      column_type: values.column_type,
      is_required: values.is_required || false,
      config: buildConfig(values),
    };

    addColumn(columnData, {
      onSuccess: () => {
        setIsAddModalVisible(false);
        form.resetFields();
      },
    });
  };

  const buildConfig = (values) => {
    const config = {};

    if (values.column_type === 'status') {
      config.options = DEFAULT_STATUS_OPTIONS;
    } else if (values.column_type === 'file') {
      config.allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
      config.maxSize = 5242880; // 5MB
      config.multiple = true;
    } else if (values.column_type === 'percentage') {
      config.min = 0;
      config.max = 100;
      config.step = 1;
      config.showPercentSign = true;
    } else if (values.column_type === 'date') {
      config.format = 'YYYY-MM-DD';
    } else if (values.column_type === 'text') {
      config.maxLength = 1000;
      config.placeholder = 'Add feedback...';
    }

    return config;
  };

  const handleDeleteColumn = (columnId) => {
    deleteColumn(columnId);
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>Manage Columns</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={700}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
            block
          >
            Add New Column
          </Button>
        </div>

        <Divider />

        {columns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <Text type="secondary">No custom columns yet. Add your first column to get started!</Text>
          </div>
        ) : (
          <List
            dataSource={columns}
            loading={isLoading}
            renderItem={(column) => (
              <List.Item
                actions={[
                  <Popconfirm
                    title="Delete column?"
                    description="All data in this column will be permanently deleted."
                    onConfirm={() => handleDeleteColumn(column.id)}
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                    >
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{column.column_name}</Text>}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">Type: {column.column_type_display || column.column_type}</Text>
                      {column.is_required && <Text type="warning">Required field</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Add Column Modal */}
      <Modal
        title="Add New Column"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddColumn}
          initialValues={{ column_type: 'text', is_required: false }}
        >
          <Form.Item
            name="column_name"
            label="Column Name"
            rules={[{ required: true, message: 'Please enter column name' }]}
          >
            <Input placeholder="e.g., Interview Date, Resume, Score" size="large" />
          </Form.Item>

          <Form.Item
            name="column_type"
            label="Column Type"
            rules={[{ required: true, message: 'Please select column type' }]}
          >
            <Select
              size="large"
              onChange={setSelectedColumnType}
              options={COLUMN_TYPES.map((type) => ({
                label: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{type.label}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{type.description}</div>
                  </div>
                ),
                value: type.value,
              }))}
            />
          </Form.Item>

          <Form.Item name="is_required" label="Required Field" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isAdding} size="large">
                Add Column
              </Button>
              <Button onClick={() => setIsAddModalVisible(false)} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ColumnManager;
