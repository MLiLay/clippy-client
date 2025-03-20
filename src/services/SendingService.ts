import SocketService from './SocketService';
import imageCompression from 'browser-image-compression';

// 图片处理相关配置
const IMAGE_CONFIG = {
  maxOriginalSize: 10 * 1024 * 1024, // 原始图片最大10MB
  compression: {
    maxSizeMB: 5, // 压缩后最大5MB
    maxWidthOrHeight: 4500, // 压缩后最大宽度或高度
    useWebWorker: true,
  }
};

/**
 * 消息发送服务类
 */
class SendingService {
  /**
   * 发送文本消息
   * @param content 消息内容
   * @param clipRegIndex 可选的剪切板寄存器索引
   */
  sendTextMessage(content: string, clipRegIndex?: number): void {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('消息内容不能为空');
    }
    
    SocketService.sendMessage('text', trimmedContent, clipRegIndex);
  }

  /**
   * 发送图片消息
   * @param file 图片文件
   */
  async sendImageMessage(file: File): Promise<void> {
    // 验证图片大小
    if (file.size > IMAGE_CONFIG.maxOriginalSize) {
      throw new Error('图片大小不能超过10MB');
    }

    try {
      // 压缩图片
      const compressedFile = await imageCompression(file, IMAGE_CONFIG.compression);
      const base64Image = await imageCompression.getDataUrlFromFile(compressedFile);
      
      // 记录压缩后大小（调试用）
      const imageSizeMB = compressedFile.size / (1024 * 1024);
      console.log(`压缩后图片大小: ${imageSizeMB.toFixed(2)} MB`);

      // 发送图片消息
      SocketService.sendMessage('image', base64Image);
    } catch (error) {
      throw new Error('压缩或发送图片失败');
    }
  }
}

// 导出服务实例
export default new SendingService();

