import { writeText, writeImage } from '@tauri-apps/plugin-clipboard-manager';
import { Message } from '../stores/useChatStore';

class ClipboardService {
  async copyMessage(message: Message): Promise<void> {
    try {
      if (message.type === 'text') {
        await this.copyText(message.content);
      } else if (message.type === 'image') {
        await this.copyImage(message.content);
      }
    } catch (error) {
      console.error('复制消息到剪贴板失败:', error);
      throw error;
    }
  }

  private async copyText(text: string): Promise<void> {
    try {
      await writeText(text);
      console.log('文本消息已复制到剪贴板。');
    } catch (error) {
      console.error('复制文本消息失败:', error);
      throw error;
    }
  }

  /**
   * 将图片文件转换为 Base64 字符串
   * @param file 图片文件
   * @returns Base64 字符串
   */
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private async copyImage(imageBase64: string): Promise<void> {
    try {
      // 将 Base64 字符串转换为 Uint8Array
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await writeImage(uint8Array);
      console.log('图片已复制到剪贴板。');
    } catch (error) {
      console.error('复制图片失败:', error);
      throw error;
    }
  }
}

export default new ClipboardService();

