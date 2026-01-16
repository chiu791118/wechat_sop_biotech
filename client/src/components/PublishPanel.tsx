import { useState, memo } from 'react';
import { Button, Typography, message, Input, Select, Divider, Spin } from 'antd';
import { SendOutlined, DownloadOutlined, PictureOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

// Memoized markdown preview component to prevent re-renders
const MarkdownPreview = memo(({ content }: { content: string }) => (
  <div className="markdown-preview" style={{ maxHeight: 400 }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
));

const { Title, Paragraph } = Typography;

const THEMES = [
  { value: 'default', label: '默认主题' },
  { value: 'github', label: 'GitHub' },
  { value: 'condensed-night-purple', label: '紫色夜晚' },
  { value: 'channing-cyan', label: '青色' },
  { value: 'han', label: '寒' },
  { value: 'geek-black', label: '极客黑' },
];

const CODE_THEMES = [
  { value: 'github', label: 'GitHub' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'vs2015', label: 'VS2015' },
  { value: 'xcode', label: 'XCode' },
];

export default function PublishPanel() {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('default');
  const [codeTheme, setCodeTheme] = useState('github');

  const {
    loading,
    articleMarkdown,
    finalArticle,
    coverImage,
    companyName,
    generateCover,
    publishDraft,
  } = useStore();

  const contentToPublish = finalArticle || articleMarkdown;

  const handleGenerateCover = async () => {
    const success = await generateCover(
      title || companyName,
      contentToPublish.substring(0, 500)
    );
    if (success) {
      message.success('封面图生成成功');
    } else {
      message.error('封面图生成失败');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      message.warning('请输入文章标题');
      return;
    }

    const success = await publishDraft(title, theme, codeTheme);
    if (success) {
      message.success('文章已发布到微信草稿箱');
    } else {
      message.error('发布失败，请检查微信配置');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([contentToPublish], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName || 'article'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Spin spinning={loading} tip="处理中...">
        <div>
          <Title level={5}>文章标题</Title>
          <Input
            size="large"
            placeholder="输入文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Paragraph strong>排版主题</Paragraph>
              <Select
                style={{ width: '100%' }}
                value={theme}
                onChange={setTheme}
                options={THEMES}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Paragraph strong>代码高亮主题</Paragraph>
              <Select
                style={{ width: '100%' }}
                value={codeTheme}
                onChange={setCodeTheme}
                options={CODE_THEMES}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Paragraph strong>封面图片</Paragraph>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button
                icon={<PictureOutlined />}
                onClick={handleGenerateCover}
                loading={loading}
              >
                AI 生成封面
              </Button>
              {coverImage && (
                <img
                  src={coverImage}
                  alt="封面"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                />
              )}
            </div>
          </div>

          <Divider />

          <Title level={5}>文章预览</Title>
          <MarkdownPreview content={contentToPublish} />

          <Divider />

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={loading}
            >
              发布到草稿箱
            </Button>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载 Markdown
            </Button>
          </div>
        </div>
      </Spin>
    </div>
  );
}
