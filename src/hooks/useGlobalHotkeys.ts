import { useEffect } from 'react';

interface Hotkey {
  key: string;
  handler: () => void;
}

export function useGlobalHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 요소에 포커스가 있으면 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // modifier 키가 눌려있으면 무시 (Ctrl+C 등과 충돌 방지)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      for (const hotkey of hotkeys) {
        if (e.key === hotkey.key) {
          e.preventDefault();
          hotkey.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys]);
}
