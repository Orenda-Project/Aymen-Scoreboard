import { Table, Button, Space, Popconfirm, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import TextCell from '../Columns/TextCell';
import DateCell from '../Columns/DateCell';
import FileCell from '../Columns/FileCell';
import PercentageCell from '../Columns/PercentageCell';
import StatusCell from '../Columns/StatusCell';

const { Text } = Typography;

const CandidateTable = ({
  candidates,
  columns,
  loading,
  positionId,
  onUpdateData,
  onDeleteCandidate,
}) => {
  const renderCell = (columnDef, dataField, candidate) => {
    const value = getValue(dataField, columnDef.column_type);

    const handleSave = (newValue) => {
      onUpdateData({
        candidateId: candidate.id,
        columnId: columnDef.id,
        value: newValue,
      });
    };

    const cellProps = {
      value,
      onSave: handleSave,
      config: columnDef.config || {},
      editable: true,
    };

    switch (columnDef.column_type) {
      case 'text':
        return <TextCell {...cellProps} />;
      case 'date':
        return <DateCell {...cellProps} />;
      case 'percentage':
        return <PercentageCell {...cellProps} />;
      case 'status':
        return <StatusCell {...cellProps} />;
      case 'file':
        return (
          <FileCell
            {...cellProps}
            candidateId={candidate.id}
            columnId={columnDef.id}
            positionId={positionId}
          />
        );
      default:
        return <Text>{value || '-'}</Text>;
    }
  };

  const getValue = (dataField, columnType) => {
    if (!dataField) return null;

    switch (columnType) {
      case 'text':
      case 'status':
        return dataField.value_text;
      case 'date':
        return dataField.value_date;
      case 'percentage':
        return dataField.value_numeric;
      case 'file':
        return dataField.value_json;
      default:
        return null;
    }
  };

  // Build table columns
  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 180,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => <Text type="secondary">{text || '-'}</Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => <Text type="secondary">{text || '-'}</Text>,
    },
    ...columns.map((col) => ({
      title: col.column_name,
      key: `column_${col.id}`,
      width: col.column_type === 'file' ? 250 : col.column_type === 'text' ? 200 : 180,
      render: (_, record) => {
        const dataField = record.data_fields?.find(
          (df) => df.column_definition === col.id
        );
        return renderCell(col, dataField, record);
      },
    })),
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />}>
            View
          </Button>
          <Popconfirm
            title="Delete candidate?"
            description="This action cannot be undone."
            onConfirm={() => onDeleteCandidate(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={tableColumns}
      dataSource={candidates}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1500, y: 600 }}
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} candidates`,
      }}
      size="small"
      bordered
    />
  );
};

export default CandidateTable;
