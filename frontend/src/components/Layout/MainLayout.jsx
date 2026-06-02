import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, TeamOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 40 }}>
          <TeamOutlined style={{ fontSize: 32, color: '#fff', marginRight: 12 }} />
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            Recruitment Scoreboard
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;
