import { defineStore } from 'pinia';

export const useClipRegStore = defineStore('clipReg', {
  state: () => ({
    // 5个剪切板寄存器，索引0-4对应寄存器1-5
    registers: ['', '', '', '', ''] as string[],
    // 剪切板寄存器功能是否启用
    enabled: true,
    // 是否同步到其他设备
    syncEnabled: true
  }),
  
  actions: {
    /**
     * 设置剪切板寄存器启用状态
     * @param status 是否启用
     */
    setEnabled(status: boolean) {
      this.enabled = status;
      if (!status) {
        // 关闭剪切板寄存器功能时，同时关闭同步功能
        this.syncEnabled = false;
      }
    },
    
    /**
     * 设置同步功能启用状态
     * @param status 是否启用同步
     */
    setSyncEnabled(status: boolean) {
      this.syncEnabled = status;
    },
    
    /**
     * 保存内容到特定的寄存器
     * @param registerIndex 寄存器索引（0-4）
     * @param content 要保存的内容
     */
    saveToRegister(registerIndex: number, content: string) {
      if (registerIndex >= 0 && registerIndex < 5) {
        this.registers[registerIndex] = content;
      }
    },
    
    /**
     * 从特定寄存器获取内容
     * @param registerIndex 寄存器索引（0-4）
     * @returns 寄存器中的内容
     */
    getFromRegister(registerIndex: number): string {
      if (registerIndex >= 0 && registerIndex < 5) {
        return this.registers[registerIndex];
      }
      return '';
    },
    
    /**
     * 清空所有寄存器
     */
    clearAllRegisters() {
      this.registers = ['', '', '', '', ''];
    }
  }
}); 