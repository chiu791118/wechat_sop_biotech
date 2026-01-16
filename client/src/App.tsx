import { useEffect, useMemo } from 'react';
import { Layout, Spin, Collapse, Typography, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useStore } from './stores/useStore';
import Login from './components/Login';
import ArticleSidebar from './components/ArticleSidebar';
import CompanyInput from './components/CompanyInput';
import FileDownload from './components/FileDownload';
import PdfUpload from './components/PdfUpload';
import ArticlePreview from './components/ArticlePreview';
import ArticleSplit from './components/ArticleSplit';
import ImageGeneration from './components/ImageGeneration';
import PublishPanel from './components/PublishPanel';
import './App.css';

const { Sider, Content } = Layout;
const { Text } = Typography;

const STEP_CONFIG = [
  { key: 1, title: '输入公司名称', component: CompanyInput },
  { key: 2, title: '下载研究框架', component: FileDownload },
  { key: 3, title: '上传研究报告', component: PdfUpload },
  { key: 4, title: '生成文章', component: ArticlePreview },
  { key: 5, title: '分割配图', component: ArticleSplit },
  { key: 6, title: '生成图片', component: ImageGeneration },
  { key: 7, title: '发布到微信', component: PublishPanel },
];

function App() {
  const { user, loading, currentStep, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const collapseItems = useMemo(() => {
    return STEP_CONFIG.map((step) => {
      const StepComponent = step.component;
      const isCompleted = step.key < currentStep;
      const isCurrent = step.key === currentStep;
      const isPending = step.key > currentStep;

      let statusIcon;
      let statusTag;
      if (isCompleted) {
        statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        statusTag = <Tag color="success">已完成</Tag>;
      } else if (isCurrent) {
        statusIcon = <LoadingOutlined style={{ color: '#1890ff' }} />;
        statusTag = <Tag color="processing">进行中</Tag>;
      } else {
        statusIcon = <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
        statusTag = <Tag>待处理</Tag>;
      }

      return {
        key: String(step.key),
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {statusIcon}
            <Text strong={isCurrent}>Step {step.key}: {step.title}</Text>
            {statusTag}
          </div>
        ),
        children: <StepComponent />,
        collapsible: isPending ? 'disabled' as const : undefined,
      };
    });
  }, [currentStep]);

  // Default open all completed steps and current step
  const defaultActiveKeys = useMemo(() => {
    return STEP_CONFIG
      .filter((step) => step.key <= currentStep)
      .map((step) => String(step.key));
  }, [currentStep]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout className="app-container">
      <Sider width={280} className="sidebar" theme="light">
        <ArticleSidebar />
      </Sider>
      <Content className="main-content">
        <div className="step-container">
          <Collapse
            items={collapseItems}
            defaultActiveKey={defaultActiveKeys}
            style={{ background: 'transparent' }}
            expandIconPosition="start"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default App;
