import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const DateCell = ({ value, onSave, editable = true, config = {} }) => {
  const handleChange = (date) => {
    if (editable && onSave) {
      onSave(date ? date.format('YYYY-MM-DD') : null);
    }
  };

  const dateFormat = config.format || 'YYYY-MM-DD';

  return (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      format={dateFormat}
      style={{ width: '100%' }}
      disabled={!editable}
      placeholder="Select date"
      size="small"
    />
  );
};

export default DateCell;
