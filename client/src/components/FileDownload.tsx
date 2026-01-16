import { Card, Button, Typography, Alert, Divider } from 'antd';
import { DownloadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph, Text } = Typography;

export default function FileDownload() {
  const { upperPart, lowerPart, upperPartFile, lowerPartFile, companyName, setCurrentStep } = useStore();

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Alert
        type="info"
        message="使用说明"
        description="下载框架文件后，请在 Gemini DeepResearch 中执行深度研究，然后将研究结果合并为 PDF 文件。"
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <Title level={5}>上半段框架 (1-10)</Title>
          <Paragraph type="secondary">
            包含疾病背景、机制、临床开发等核心研究指令
          </Paragraph>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(upperPart, upperPartFile || `${companyName}_framework_upper.txt`)}
            disabled={!upperPart}
          >
            下载上半段
          </Button>
        </Card>

        <Card style={{ flex: 1 }}>
          <Title level={5}>下半段框架 (11-竞争分析)</Title>
          <Paragraph type="secondary">
            包含风险分析与竞争对比研究指令
          </Paragraph>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(lowerPart, lowerPartFile || `${companyName}_framework_lower.txt`)}
            disabled={!lowerPart}
          >
            下载下半段
          </Button>
        </Card>
      </div>

      <Divider />

      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
        <Title level={5}>下一步操作：</Title>
        <ol style={{ paddingLeft: 20 }}>
          <li>
            <Text>分别使用两个框架在 </Text>
            <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer">
              Gemini DeepResearch
            </a>
            <Text> 执行深度研究</Text>
          </li>
          <li>将两个研究结果合并为一个 PDF 文件</li>
          <li>上传合并后的 PDF 到下一步</li>
        </ol>
      </div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => setCurrentStep(3)}
        >
          下一步：上传研究PDF
        </Button>
      </div>
    </div>
  );
}
