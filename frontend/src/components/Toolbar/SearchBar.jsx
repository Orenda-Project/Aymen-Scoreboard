import { useState, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const SearchBar = ({ onSearch, placeholder = 'Search candidates...', debounceMs = 500 }) => {
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  return (
    <Search
      placeholder={placeholder}
      allowClear
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      prefix={<SearchOutlined />}
      style={{ width: 300 }}
    />
  );
};

export default SearchBar;
