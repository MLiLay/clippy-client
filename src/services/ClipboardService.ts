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

  async copyText(text: string): Promise<void> {
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
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async copyImage(imageBase64: string): Promise<void> {
    try {
      const response = await fetch(imageBase64);
      const arrayBuffer = await response.blob().then(blob => blob.arrayBuffer());
      await writeImage(new Uint8Array(arrayBuffer));
      console.log('图片已复制到剪贴板。');
    } catch (error) {
      console.error('复制图片失败:', error);
      throw error;
    }
  }
}

export default new ClipboardService();

