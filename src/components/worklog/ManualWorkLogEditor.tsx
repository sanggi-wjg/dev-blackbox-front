import { useRef, useCallback, useEffect } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { history } from '@milkdown/kit/plugin/history';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { replaceAll } from '@milkdown/kit/utils';
import { nord } from '@milkdown/theme-nord';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { PencilSquareIcon } from '@/components/icons';

interface ManualWorkLogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
}

interface MilkdownEditorInnerProps {
  defaultValue: string;
  onChange: (markdown: string) => void;
  editorRef: React.MutableRefObject<Editor | undefined>;
}

function MilkdownEditorInner({ defaultValue, onChange, editorRef }: MilkdownEditorInnerProps) {
  const { get } = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, defaultValue);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChange(markdown);
          }
        });
      })
      .use(commonmark)
      .use(listener)
      .use(history),
  );

  useEffect(() => {
    editorRef.current = get();
  }, [get, editorRef]);

  return <Milkdown />;
}

export default function ManualWorkLogEditor({ content, onChange, onSave, saving = false }: ManualWorkLogEditorProps) {
  const editorRef = useRef<Editor | undefined>(undefined);
  const prevContentRef = useRef<string>(content);

  // 외부에서 content가 변경될 때 (날짜 변경 등) 에디터 내용을 교체
  const syncContent = useCallback(() => {
    if (editorRef.current && content !== prevContentRef.current) {
      prevContentRef.current = content;
      try {
        editorRef.current.action(replaceAll(content));
      } catch {
        // 에디터가 아직 준비되지 않은 경우 무시
      }
    }
  }, [content]);

  useEffect(() => {
    syncContent();
  }, [syncContent]);

  const handleChange = useCallback(
    (markdown: string) => {
      prevContentRef.current = markdown;
      onChange(markdown);
    },
    [onChange],
  );

  return (
    <Card padding="none" className="flex flex-col">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PencilSquareIcon className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">직접 작성</span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="milkdown-wrap min-h-[300px] resize-y overflow-auto rounded-lg border border-border-primary bg-surface-secondary focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
          <MilkdownProvider>
            <MilkdownEditorInner
              defaultValue={content}
              onChange={handleChange}
              editorRef={editorRef}
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
