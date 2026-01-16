import { Button, Typography, message, Spin, Image, Empty, Alert } from 'antd';
import { ArrowRightOutlined, PictureOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph, Text } = Typography;

export default function ImageGeneration() {
  const {
    user,
    loading,
    imagePrompts,
    generatedImages,
    generateImages,
    finalizeArticle,
    setCurrentStep,
  } = useStore();

  const hasPermission = user?.role === 'admin' || user?.role === 'advanced';

  const handleGenerateImages = async () => {
    if (!hasPermission) {
      message.warning('您没有图片生成权限');
      return;
    }

    const success = await generateImages();
    if (success) {
      message.success('配图生成成功');
    } else {
      message.error('配图生成失败');
    }
  };

  const handleFinalize = async () => {
    const success = await finalizeArticle();
    if (success) {
      message.success('最终文章生成成功');
      setCurrentStep(7);
    } else {
      message.error('生成失败');
    }
  };

  const handleSkip = () => {
    setCurrentStep(7);
  };

  return (
    <div>
      {!hasPermission && (
        <Alert
          type="warning"
          message="权限提示"
          description="图片生成功能仅对 admin 和 advanced 用户开放。您可以跳过此步骤直接发布文章。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Paragraph type="secondary">
        根据生图 Prompt 批量生成麦肯锡风格的科学配图。
      </Paragraph>

      <div style={{ marginTop: 16 }}>
        <Text strong>待生成配图数量：{imagePrompts.length}</Text>
      </div>

      <Spin spinning={loading} tip="AI 正在生成配图...">
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={handleGenerateImages}
            loading={loading}
            disabled={!hasPermission || imagePrompts.length === 0 || generatedImages.length > 0}
          >
            批量生成配图
          </Button>
          <Button onClick={handleSkip}>
            跳过配图，直接发布
          </Button>
        </div>

        {generatedImages.length > 0 ? (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>已生成的配图 ({generatedImages.length})</Title>
            <div className="image-grid">
              {generatedImages.map((url, index) => (
                <div key={index} className="image-card">
                  <Image
                    src={url}
                    alt={`配图 ${index + 1}`}
                    style={{ width: '100%', height: 150, objectFit: 'cover' }}
                  />
                  <div style={{ padding: 8 }}>
                    <Text type="secondary">配图 {index + 1}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <Empty description="暂无生成的配图" />
          </div>
        )}
      </Spin>

      {generatedImages.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            onClick={handleFinalize}
            loading={loading}
            style={{ marginRight: 12 }}
          >
            插入配图生成最终文章
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(7)}
          >
            直接进入发布
          </Button>
        </div>
      )}
    </div>
  );
}
