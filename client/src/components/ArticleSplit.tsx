import { Card, Button, Typography, message, Tabs, Spin } from 'antd';
import { ArrowRightOutlined, ScissorOutlined, PictureOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

const { Paragraph, Text } = Typography;

export default function ArticleSplit() {
  const {
    loading,
    imageText,
    articleSkeleton,
    imagePrompts,
    splitArticle,
    generateImageText,
    generateArticleSkeleton,
    generateImagePrompts,
    setCurrentStep,
  } = useStore();

  const handleSplitAll = async () => {
    const success = await splitArticle();
    if (success) {
      message.success('文章分割完成');
    } else {
      message.error('文章分割失败');
    }
  };

  const handleGenerateImageText = async () => {
    const success = await generateImageText();
    if (success) {
      message.success('生图文本生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const handleGenerateSkeleton = async () => {
    const success = await generateArticleSkeleton();
    if (success) {
      message.success('文章骨架生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const handleGeneratePrompts = async () => {
    const success = await generateImagePrompts();
    if (success) {
      message.success('生图 Prompt 生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: '一键分割',
      children: (
        <div>
          <Paragraph type="secondary">
            一键完成所有分割步骤：生成生图文本、文章骨架和生图 Prompt。
          </Paragraph>
          <Button
            type="primary"
            icon={<ScissorOutlined />}
            onClick={handleSplitAll}
            loading={loading}
            size="large"
          >
            一键分割文章
          </Button>
        </div>
      ),
    },
    {
      key: 'imageText',
      label: '生图文本',
      children: (
        <div>
          <Paragraph type="secondary">
            标记适合生成 PPT 风格配图的段落。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateImageText}
            loading={loading}
            disabled={!!imageText}
            style={{ marginBottom: 16 }}
          >
            生成生图文本
          </Button>
          {imageText && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{imageText}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'skeleton',
      label: '文章骨架',
      children: (
        <div>
          <Paragraph type="secondary">
            用占位符替换需要配图的段落，生成文章骨架。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateSkeleton}
            loading={loading}
            disabled={!imageText || !!articleSkeleton}
            style={{ marginBottom: 16 }}
          >
            生成文章骨架
          </Button>
          {articleSkeleton && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{articleSkeleton}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'prompts',
      label: '生图 Prompt',
      children: (
        <div>
          <Paragraph type="secondary">
            为每个标记段落生成麦肯锡风格的 PPT 配图 Prompt。
          </Paragraph>
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={handleGeneratePrompts}
            loading={loading}
            disabled={!imageText || imagePrompts.length > 0}
            style={{ marginBottom: 16 }}
          >
            生成配图 Prompt
          </Button>
          {imagePrompts.length > 0 && (
            <div>
              <Text strong>共 {imagePrompts.length} 个配图 Prompt：</Text>
              <div style={{ marginTop: 16 }}>
                {imagePrompts.map((prompt, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ marginBottom: 8 }}
                    title={`配图 ${index + 1}`}
                  >
                    <Text>{prompt}</Text>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Spin spinning={loading} tip="AI 正在处理中...">
        <Tabs items={tabItems} />
      </Spin>

      {imagePrompts.length > 0 && articleSkeleton && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(6)}
          >
            下一步：生成配图
          </Button>
        </div>
      )}
    </div>
  );
}
