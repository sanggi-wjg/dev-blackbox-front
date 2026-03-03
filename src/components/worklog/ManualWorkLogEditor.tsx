import { useState, useEffect, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';

interface ManualWorkLogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function ManualWorkLogEditor({ content, onChange, onSave, saving = false }: ManualWorkLogEditorProps) {
  const [editorHeight, setEditorHeight] = useState(500);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const BOTTOM_PADDING = 60; // Card 패딩 + main 패딩 + 여백

  const calcHeight = useCallback(() => {
    if (!editorWrapRef.current) return;
    const top = editorWrapRef.current.getBoundingClientRect().top;
    const available = window.innerHeight - top - BOTTOM_PADDING;
    setEditorHeight(Math.max(300, available));
  }, []);

  useEffect(() => {
    calcHeight();
    const ro = new ResizeObserver(calcHeight);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [calcHeight]);

  return (
    <div ref={editorWrapRef} data-color-mode={theme} className="[&_.wmde-markdown]:![font-size:13px]">
      <MDEditor
        value={content}
        onChange={(val) => onChange(val ?? '')}
        height={editorHeight}
        preview="live"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !saving) {
            e.preventDefault();
            onSave();
          }
        }}
      />
    </div>
  );
}