import { TrayIcon } from '@tauri-apps/api/tray';
import { Menu } from '@tauri-apps/api/menu';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

export function useTray() {
  const showMainWindow = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.show();
    await appWindow.setFocus();
  };

  const handleCloseRequested = (event: any) => {
    event.preventDefault?.();
    getCurrentWindow().hide();
  };

  const initTray = async () => {
    const menu = await Menu.new({
      items: [
        {
          id: 'quit',
          text: '退出',
          action: () => exit(0)
        },
      ],
    });

    return await TrayIcon.new({
      icon: await defaultWindowIcon() ?? undefined,
      menu,
      menuOnLeftClick: false,
      action: (event) => {
        if (event.type === 'Click' && event.button === 'Left') {
          showMainWindow();
        }
      },
    });
  };

  return {
    initTray,
    handleCloseRequested,
    showMainWindow
  };
}