import { InputNumber, Progress, Space } from 'antd';

const PercentageCell = ({ value, onSave, editable = true, config = {} }) => {
  const min = config.min || 0;
  const max = config.max || 100;
  const step = config.step || 1;
  const showPercentSign = config.showPercentSign !== false;

  const handleChange = (newValue) => {
    if (editable && onSave) {
      onSave(newValue);
    }
  };

  const numericValue = value ? Number(value) : 0;

  return (
    <Space direction="horizontal" size="small" style={{ width: '100%' }}>
      <InputNumber
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={handleChange}
        formatter={(val) => (showPercentSign && val ? `${val}%` : val)}
        parser={(val) => val?.replace('%', '')}
        style={{ width: 80 }}
        disabled={!editable}
        size="small"
      />
      <Progress
        percent={numericValue}
        size="small"
        style={{ flex: 1, minWidth: 100 }}
        showInfo={false}
        strokeColor={
          numericValue >= 80
            ? '#52c41a'
            : numericValue >= 60
            ? '#1890ff'
            : numericValue >= 40
            ? '#faad14'
            : '#ff4d4f'
        }
      />
    </Space>
  );
};

export default PercentageCell;
