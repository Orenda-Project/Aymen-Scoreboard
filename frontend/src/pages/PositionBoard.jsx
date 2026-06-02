import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, Empty, Space, Breadcrumb, Badge } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SettingOutlined, FilterOutlined } from '@ant-design/icons';
import { usePosition } from '../hooks/usePositions';
import { useColumns } from '../hooks/useColumns';
import useCandidates from '../hooks/useCandidates';
import ColumnManager from '../components/Position/ColumnManager';
import CandidateTable from '../components/Candidate/CandidateTable';
import AddCandidateModal from '../components/Candidate/AddCandidateModal';
import SearchBar from '../components/Toolbar/SearchBar';
import FilterPanel from '../components/Toolbar/FilterPanel';

const { Title, Text } = Typography;

const PositionBoard = () => {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const { position, isLoading: positionLoading } = usePosition(positionId);
  const { columns, isLoading: columnsLoading } = useColumns(positionId);

  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({});

  const {
    candidates,
    isLoading: candidatesLoading,
    createCandidate,
    deleteCandidate,
    updateCandidateData,
    isCreating,
  } = useCandidates(positionId, {
    search: searchQuery,
    column_filters: columnFilters,
  });

  const [isColumnManagerVisible, setIsColumnManagerVisible] = useState(false);
  const [isAddCandidateVisible, setIsAddCandidateVisible] = useState(false);
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (filters) => {
    setColumnFilters(filters);
    setIsFilterPanelVisible(false);
  };

  const activeFiltersCount = Object.keys(columnFilters).length;

  if (positionLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!position) {
    return (
      <Card>
        <Empty description="Position not found">
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <a onClick={() => navigate('/dashboard')}>Dashboard</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{position.name}</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {position.name}
            </Title>
            {position.description && <Text type="secondary">{position.description}</Text>}
          </div>
          <Space>
            <Button
              icon={<SettingOutlined />}
              size="large"
              onClick={() => setIsColumnManagerVisible(true)}
            >
              Manage Columns
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsAddCandidateVisible(true)}
            >
              Add Candidate
            </Button>
          </Space>
        </div>
      </div>

      {/* Toolbar */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <SearchBar onSearch={handleSearch} />
            <Badge count={activeFiltersCount} offset={[0, 0]}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setIsFilterPanelVisible(true)}
              >
                Filter
              </Button>
            </Badge>
          </Space>
          <Text type="secondary">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
          </Text>
        </Space>
      </Card>

      {/* Main Content */}
      <Card>
        {candidatesLoading || columnsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : candidates.length === 0 && !searchQuery && activeFiltersCount === 0 ? (
          <Empty
            description="No candidates yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 40 }}
          >
            <Space direction="vertical" align="center">
              <Text type="secondary">
                {columns.length === 0
                  ? 'First, add some columns to customize your candidate tracking.'
                  : 'Start by adding your first candidate!'}
              </Text>
              <Space>
                {columns.length === 0 && (
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setIsColumnManagerVisible(true)}
                  >
                    Add Columns
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddCandidateVisible(true)}
                >
                  Add First Candidate
                </Button>
              </Space>
            </Empty>
          </Empty>
        ) : candidates.length === 0 ? (
          <Empty
            description="No candidates match your search or filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 40 }}
          >
            <Button onClick={() => { setSearchQuery(''); setColumnFilters({}); }}>
              Clear Filters
            </Button>
          </Empty>
        ) : (
          <CandidateTable
            candidates={candidates}
            columns={columns}
            loading={candidatesLoading}
            positionId={positionId}
            onUpdateData={updateCandidateData}
            onDeleteCandidate={deleteCandidate}
          />
        )}
      </Card>

      {/* Modals and Drawers */}
      <ColumnManager
        positionId={positionId}
        visible={isColumnManagerVisible}
        onClose={() => setIsColumnManagerVisible(false)}
      />

      <AddCandidateModal
        visible={isAddCandidateVisible}
        onClose={() => setIsAddCandidateVisible(false)}
        onAdd={createCandidate}
        positionId={positionId}
        isAdding={isCreating}
      />

      <FilterPanel
        visible={isFilterPanelVisible}
        onClose={() => setIsFilterPanelVisible(false)}
        columns={columns}
        onApplyFilters={handleApplyFilters}
        activeFiltersCount={activeFiltersCount}
      />
    </div>
  );
};

export default PositionBoard;
