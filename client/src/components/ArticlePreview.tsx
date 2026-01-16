import { useState } from 'react';
import { Button, Typography, message, Radio, Upload, Tabs, Spin } from 'antd';
import { FileTextOutlined, EditOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

const { Paragraph } = Typography;

export default function ArticlePreview() {
  const [referenceFileList, setReferenceFileList] = useState<UploadFile[]>([]);

  const {
    loading,
    storyline,
    articleMarkdown,
    selectedModel,
    setSelectedModel,
    generateStoryline,
    generateArticle,
    polishArticle,
    uploadReferencePdf,
    setCurrentStep,
  } = useStore();

  const handleGenerateStoryline = async () => {
    const success = await generateStoryline();
    if (success) {
      message.success('Storyline 生成成功');
    } else {
      message.error('Storyline 生成失败');
    }
  };

  const handleGenerateArticle = async () => {
    const success = await generateArticle();
    if (success) {
      message.success('文章生成成功');
    } else {
      message.error('文章生成失败');
    }
  };

  const handlePolish = async () => {
    const success = await polishArticle();
    if (success) {
      message.success('文章润色成功');
    } else {
      message.error('文章润色失败');
    }
  };

  const handleUploadReference = async () => {
    if (referenceFileList.length === 0) return;
    const file = referenceFileList[0].originFileObj as File;
    const success = await uploadReferencePdf(file);
    if (success) {
      message.success('参考文章已上传');
    }
  };

  const tabItems = [
    {
      key: 'storyline',
      label: 'Storyline',
      children: (
        <div>
          <Paragraph type="secondary">
            Storyline 是文章的核心叙事线，包含主题句和关键研究议题。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateStoryline}
            loading={loading}
            disabled={!!storyline}
            style={{ marginBottom: 16 }}
          >
            生成 Storyline
          </Button>
          {storyline && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{storyline}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      label: '参考文章',
      children: (
        <div>
          <Paragraph type="secondary">
            上传参考文章 PDF，系统将参考其文风进行写作。（可选）
          </Paragraph>
          <Upload
            accept=".pdf"
            maxCount={1}
            fileList={referenceFileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setReferenceFileList(fileList)}
          >
            <Button icon={<FileTextOutlined />}>选择参考文章 PDF</Button>
          </Upload>
          {referenceFileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUploadReference}
              style={{ marginTop: 8 }}
              loading={loading}
            >
              上传参考文章
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'generate',
      label: '生成文章',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Paragraph strong>选择 AI 模型：</Paragraph>
            <Radio.Group
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <Radio.Button value="deepseek">DeepSeek (推荐)</Radio.Button>
              <Radio.Button value="gemini">Gemini</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="primary"
              onClick={handleGenerateArticle}
              loading={loading}
              disabled={!storyline}
            >
              生成文章
            </Button>
            {articleMarkdown && (
              <Button
                icon={<EditOutlined />}
                onClick={handlePolish}
                loading={loading}
              >
                润色文章
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'preview',
      label: '文章预览',
      children: articleMarkdown ? (
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{articleMarkdown}</ReactMarkdown>
        </div>
      ) : (
        <Paragraph type="secondary">文章生成后将在此显示预览</Paragraph>
      ),
    },
  ];

  return (
    <div>
      <Spin spinning={loading} tip="AI 正在处理中...">
        <Tabs items={tabItems} />
      </Spin>

      {articleMarkdown && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<EditOutlined />}
            onClick={handlePolish}
            loading={loading}
            size="large"
          >
            润色文章
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(5)}
          >
            下一步：分割配图
          </Button>
        </div>
      )}
    </div>
  );
}
