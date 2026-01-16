import { useState } from 'react';
import { Input, Button, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph } = Typography;

export default function CompanyInput() {
  const [inputValue, setInputValue] = useState('');
  const { companyName, loading, generateFramework, currentArticle } = useStore();

  const handleGenerate = async () => {
    const name = inputValue.trim() || companyName;
    if (!name) {
      message.warning('请输入公司名称');
      return;
    }

    const success = await generateFramework(name);
    if (success) {
      message.success('研究框架生成成功');
    } else {
      message.error('框架生成失败，请重试');
    }
  };

  return (
    <div>
      <Paragraph type="secondary">
          输入您要研究的生物科技公司名称，系统将自动生成11点研究框架。
        </Paragraph>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Input
            size="large"
            placeholder="例如：Argenx / Viking Therapeutics"
            value={inputValue || currentArticle?.companyName || ''}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleGenerate}
            disabled={loading}
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleGenerate}
          >
            生成框架
          </Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Title level={5}>11点研究框架包括：</Title>
          <ol style={{ paddingLeft: 20, color: '#666' }}>
            <li>疾病背景与未满足需求</li>
            <li>作用机制（核心）</li>
            <li>资产/平台架构</li>
            <li>临床前证据</li>
            <li>临床开发状态</li>
            <li>临床有效性信号</li>
            <li>安全性与耐受性</li>
            <li>与竞争对手的差异化</li>
            <li>监管路径</li>
            <li>商业化逻辑</li>
            <li>关键风险与失败模式</li>
          </ol>
        </div>
    </div>
  );
}
