import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Empty, Spin, Row, Col, Typography, Modal, Form, Input, Space, Tag } from 'antd';
import { PlusOutlined, UserOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePositions } from '../hooks/usePositions';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Dashboard = () => {
  const navigate = useNavigate();
  const { positions, isLoading, createPosition, deletePosition, isCreating } = usePositions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleCreatePosition = async (values) => {
    createPosition(values, {
      onSuccess: () => {
        setIsModalVisible(false);
        form.resetFields();
      },
    });
  };

  const handleDeletePosition = (positionId) => {
    Modal.confirm({
      title: 'Delete Position',
      content: 'Are you sure you want to delete this position? All candidates and data will be permanently deleted.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deletePosition(positionId),
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Job Positions</Title>
          <Text type="secondary">Manage recruitment for different positions</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsModalVisible(true)}
        >
          New Position
        </Button>
      </div>

      {positions.length === 0 ? (
        <Card>
          <Empty
            description="No positions yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Create First Position
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {positions.map((position) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={position.id}>
              <Card
                hoverable
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/positions/${position.id}`)}
                  >
                    View
                  </Button>,
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeletePosition(position.id)}
                  >
                    Delete
                  </Button>,
                ]}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ marginBottom: 8 }}>{position.name}</Title>
                  {position.description && (
                    <Text type="secondary" ellipsis={{ rows: 2 }}>
                      {position.description}
                    </Text>
                  )}
                </div>
                <Space>
                  <Tag icon={<UserOutlined />} color="blue">
                    {position.candidate_count || 0} Candidates
                  </Tag>
                  <Tag color={position.is_active ? 'green' : 'default'}>
                    {position.is_active ? 'Active' : 'Inactive'}
                  </Tag>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Position Modal */}
      <Modal
        title="Create New Position"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePosition}
        >
          <Form.Item
            name="name"
            label="Position Name"
            rules={[{ required: true, message: 'Please enter position name' }]}
          >
            <Input placeholder="e.g., Software Engineer, Product Manager" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Brief description of the role..." />
          </Form.Item>

          <Form.Item name="is_active" initialValue={true} hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isCreating} size="large">
                Create Position
              </Button>
              <Button onClick={() => setIsModalVisible(false)} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
