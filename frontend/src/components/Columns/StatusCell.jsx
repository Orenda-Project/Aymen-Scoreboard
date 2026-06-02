import { Select, Tag } from 'antd';

const StatusCell = ({ value, onSave, editable = true, config = {} }) => {
  const options = config.options || [];

  const handleChange = (newValue) => {
    if (editable && onSave) {
      onSave(newValue);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  if (!editable && selectedOption) {
    return <Tag color={selectedOption.color}>{selectedOption.label}</Tag>;
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      style={{ width: '100%' }}
      placeholder="Select status"
      disabled={!editable}
      size="small"
      showSearch
      optionFilterProp="children"
    >
      {options.map((option) => (
        <Select.Option key={option.value} value={option.value}>
          <Tag color={option.color} style={{ marginRight: 8 }}>
            {option.label}
          </Tag>
        </Select.Option>
      ))}
    </Select>
  );
};

export default StatusCell;
