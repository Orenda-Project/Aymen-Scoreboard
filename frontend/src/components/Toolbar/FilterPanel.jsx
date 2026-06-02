import { useState, useEffect } from 'react';
import { Drawer, Form, Button, Space, Select, InputNumber, DatePicker, Badge } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const FilterPanel = ({ visible, onClose, columns, onApplyFilters, activeFiltersCount }) => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});

  const handleApply = () => {
    const values = form.getFieldsValue();
    const columnFilters = {};

    // Build filters object
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        const columnId = key.replace('filter_', '');
        const column = columns.find((col) => col.id === parseInt(columnId));

        if (column) {
          if (column.column_type === 'percentage' && Array.isArray(values[key])) {
            // Percentage range
            const [min, max] = values[key];
            if (min !== undefined || max !== undefined) {
              columnFilters[columnId] = { min, max };
            }
          } else if (column.column_type === 'date' && Array.isArray(values[key])) {
            // Date range
            const [start, end] = values[key];
            if (start && end) {
              columnFilters[columnId] = {
                start: start.format('YYYY-MM-DD'),
                end: end.format('YYYY-MM-DD'),
              };
            }
          } else {
            columnFilters[columnId] = values[key];
          }
        }
      }
    });

    setFilters(columnFilters);
    onApplyFilters(columnFilters);
  };

  const handleClear = () => {
    form.resetFields();
    setFilters({});
    onApplyFilters({});
  };

  const renderFilterControl = (column) => {
    const fieldName = `filter_${column.id}`;

    switch (column.column_type) {
      case 'status':
        const options = column.config?.options || [];
        return (
          <Form.Item name={fieldName} label={column.column_name}>
            <Select
              mode="multiple"
              placeholder="Select status"
              allowClear
              options={options.map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))}
            />
          </Form.Item>
        );

      case 'percentage':
        return (
          <Form.Item label={column.column_name}>
            <Space>
              <Form.Item name={[fieldName, 0]} noStyle>
                <InputNumber placeholder="Min" min={0} max={100} style={{ width: 100 }} />
              </Form.Item>
              <span>to</span>
              <Form.Item name={[fieldName, 1]} noStyle>
                <InputNumber placeholder="Max" min={0} max={100} style={{ width: 100 }} />
              </Form.Item>
            </Space>
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item name={fieldName} label={column.column_name}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'text':
        return null; // Text search handled by main search bar

      default:
        return null;
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <FilterOutlined />
          <span>Filter Candidates</span>
          {activeFiltersCount > 0 && (
            <Badge count={activeFiltersCount} style={{ backgroundColor: '#1890ff' }} />
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleClear}>Clear All</Button>
          <Button type="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {columns
          .filter((col) => col.column_type !== 'text' && col.column_type !== 'file')
          .map((column) => (
            <div key={column.id}>{renderFilterControl(column)}</div>
          ))}

        {columns.filter((col) => col.column_type !== 'text' && col.column_type !== 'file')
          .length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            No filterable columns available. Add Status, Date, or Percentage columns to enable
            filtering.
          </div>
        )}
      </Form>
    </Drawer>
  );
};

export default FilterPanel;
