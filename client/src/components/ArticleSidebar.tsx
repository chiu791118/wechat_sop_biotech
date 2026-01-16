import { useEffect, useState } from 'react';
import { Menu, Button, Input, Modal, Typography, Avatar, Dropdown } from 'antd';
import { PlusOutlined, FileTextOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Text } = Typography;

export default function ArticleSidebar() {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const {
    user,
    articles,
    currentArticle,
    loadArticles,
    createArticle,
    selectArticle,
    logout,
  } = useStore();

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleCreate = async () => {
    if (!newCompanyName.trim()) return;
    await createArticle(newCompanyName.trim());
    setNewCompanyName('');
    setModalVisible(false);
  };

  const menuItems = articles.map((article) => ({
    key: article.id,
    icon: <FileTextOutlined />,
    label: (
      <div style={{ lineHeight: 1.4 }}>
        <div style={{ fontWeight: 500 }}>{article.companyName}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {new Date(article.createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    ),
  }));

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => setModalVisible(true)}
        >
          新建文章项目
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={currentArticle ? [currentArticle.id] : []}
          items={menuItems}
          onClick={({ key }) => selectArticle(key)}
          style={{ border: 'none' }}
        />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e8e8e8' }}>
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <div>
              <div>{user?.username}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user?.role}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>

      <Modal
        title="新建文章项目"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="输入公司名称"
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </div>
  );
}
