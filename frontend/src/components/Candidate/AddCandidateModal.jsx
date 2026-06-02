import { Modal, Form, Input, Button, Space } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

const AddCandidateModal = ({ visible, onClose, onAdd, positionId, isAdding }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    onAdd(
      {
        position: positionId,
        ...values,
      },
      {
        onSuccess: () => {
          form.resetFields();
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          <span>Add New Candidate</span>
        </Space>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter candidate name' }]}
        >
          <Input placeholder="e.g., John Doe" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="john.doe@example.com" size="large" />
        </Form.Item>

        <Form.Item name="phone" label="Phone Number">
          <Input placeholder="+1 (555) 123-4567" size="large" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={isAdding} size="large">
              Add Candidate
            </Button>
            <Button onClick={onClose} size="large">
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCandidateModal;
