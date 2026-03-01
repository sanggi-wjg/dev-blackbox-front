import { useState, useEffect, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { PencilSquareIcon, ClipboardDocumentIcon, CheckIcon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

interface ManualWorkLogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
  onCopy?: () => void;
}

export default function ManualWorkLogEditor({
  content,
  onChange,
  onSave,
  saving = false,
  onCopy,
}: ManualWorkLogEditorProps) {
  const [copied, setCopied] = useState(false);
  const [editorHeight, setEditorHeight] = useState(500);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const BOTTOM_PADDING = 120; // 하단 저장 버튼 + Card 패딩 + main 패딩 + 여백

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

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = () => {
    setCopied(true);
    onCopy?.();
  };

  return (
    <Card padding="none" className="flex flex-col">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PencilSquareIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">수기 업무일지</span>
        </div>
        {onCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary cursor-pointer"
            title="마크다운 복사"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-3">
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
        <div className="flex items-center justify-end gap-2">
          <kbd className="hidden text-xs text-text-tertiary sm:inline">
            <kbd className="rounded border border-border-primary bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>
            {' + '}
            <kbd className="rounded border border-border-primary bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
          </kbd>
          <Button variant="primary" size="sm" onClick={onSave} loading={saving} loadingText="저장 중...">
            저장
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
