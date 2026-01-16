import { useState } from 'react';
import { Upload, Button, Typography, message, Modal } from 'antd';
import { UploadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useStore } from '../stores/useStore';

const { Paragraph, Text } = Typography;
const { Dragger } = Upload;

export default function PdfUpload() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const { loading, extractedText, uploadResearchPdf } = useStore();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择 PDF 文件');
      return;
    }

    const file = fileList[0].originFileObj as File;
    const success = await uploadResearchPdf(file);

    if (success) {
      message.success('PDF 上传成功，文本已提取');
    } else {
      message.error('PDF 上传失败');
    }
  };

  return (
    <div>
      <Paragraph type="secondary">
        上传合并后的 Gemini DeepResearch 研究报告 PDF 文件。
      </Paragraph>

      <Dragger
        accept=".pdf"
        maxCount={1}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList }) => setFileList(fileList)}
        style={{ marginTop: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽 PDF 文件到此区域</p>
        <p className="ant-upload-hint">支持单个 PDF 文件，最大 50MB</p>
      </Dragger>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          上传并提取文本
        </Button>

        {extractedText && (
          <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
            预览提取结果
          </Button>
        )}
      </div>

      {extractedText && (
        <div style={{ marginTop: 16 }}>
          <Text type="success">
            ✓ 已成功提取 {extractedText.length} 字符
          </Text>
        </div>
      )}

      <Modal
        title="提取的文本内容"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {extractedText}
        </div>
      </Modal>
    </div>
  );
}
