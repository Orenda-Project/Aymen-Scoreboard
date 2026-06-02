import { useState } from 'react';
import { Input, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

const TextCell = ({ value, onSave, editable = true, config = {} }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value || '');

  const handleSave = () => {
    setIsEditing(false);
    if (text !== value) {
      onSave?.(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setText(value || '');
      setIsEditing(false);
    }
  };

  if (!editable) {
    return <Text>{value || '-'}</Text>;
  }

  if (isEditing) {
    return (
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 2, maxRows: 6 }}
        maxLength={config.maxLength}
        autoFocus
        placeholder={config.placeholder || 'Enter text...'}
      />
    );
  }

  return (
    <div
      onClick={() => editable && setIsEditing(true)}
      style={{
        cursor: editable ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: 4,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => editable && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {text ? (
        <Text ellipsis={{ tooltip: text }} style={{ flex: 1 }}>
          {text}
        </Text>
      ) : (
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          {config.placeholder || 'Click to add...'}
        </Text>
      )}
      {editable && <EditOutlined style={{ marginLeft: 8, color: '#999', fontSize: 12 }} />}
    </div>
  );
};

export default TextCell;
