import { useState, useRef, useEffect } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { history } from '@milkdown/kit/plugin/history';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { replaceAll } from '@milkdown/kit/utils';
import { nord } from '@milkdown/theme-nord';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { PencilSquareIcon, ClipboardDocumentIcon, CheckIcon } from '@/components/icons';

interface ManualWorkLogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
  onCopy?: () => void;
}

interface MilkdownEditorInnerProps {
  content: string;
  onChange: (markdown: string) => void;
}

function MilkdownEditorInner({ content, onChange }: MilkdownEditorInnerProps) {
  const isInternalChange = useRef(false);

  const { get, loading } = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            isInternalChange.current = true;
            onChange(markdown);
          }
        });
      })
      .use(commonmark)
      .use(listener)
      .use(history),
  );

  // 외부 content 변경 시에만 에디터에 동기화 (에디터 자체 타이핑은 무시)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const editor = get();
    if (editor) {
      try {
        editor.action(replaceAll(content));
      } catch {
        // 에디터가 아직 준비되지 않은 경우 무시
      }
    }
  }, [content, get, loading]);

  return <Milkdown />;
}

export default function ManualWorkLogEditor({ content, onChange, onSave, saving = false, onCopy }: ManualWorkLogEditorProps) {
  const [copied, setCopied] = useState(false);

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
          <span className="text-sm font-semibold text-text-primary">직접 작성</span>
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
        <div
          className="milkdown-wrap min-h-[300px] resize-y overflow-auto rounded-lg border border-border-primary bg-surface-secondary focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !saving) {
              e.preventDefault();
              onSave();
            }
          }}
        >
          <MilkdownProvider>
            <MilkdownEditorInner
              content={content}
              onChange={onChange}
            />
          </MilkdownProvider>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onSave} loading={saving} loadingText="저장 중...">
            저장
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
