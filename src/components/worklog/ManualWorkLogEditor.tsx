import { useState } from 'react';
import Markdown from 'react-markdown';
import Card, { CardHeader, CardBody } from '@/components/common/Card';
import Tabs from '@/components/common/Tabs';
import Button from '@/components/common/Button';
import { PencilSquareIcon, EyeIcon } from '@/components/icons';

interface ManualWorkLogEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
}

const editorTabs = [
  { id: 'edit', label: '편집', icon: <PencilSquareIcon className="h-4 w-4" /> },
  { id: 'preview', label: '미리보기', icon: <EyeIcon className="h-4 w-4" /> },
];

export default function ManualWorkLogEditor({ content, onChange, onSave, saving = false }: ManualWorkLogEditorProps) {
  const [mode, setMode] = useState('edit');

  return (
    <Card padding="none" className="flex flex-col">
      <CardHeader className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-text-primary">직접 작성</span>
        <Tabs tabs={editorTabs} activeTab={mode} onChange={setMode} />
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-3">
        {mode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="마크다운으로 업무일지를 작성하세요..."
            className="min-h-[300px] w-full flex-1 resize-y rounded-lg border border-border-primary bg-surface-secondary p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
          />
        ) : (
          <div className="min-h-[300px] rounded-lg border border-border-primary bg-surface-secondary p-3">
            {content.trim() ? (
              <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-code:rounded prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:text-text-primary prose-code:before:content-none prose-code:after:content-none">
                <Markdown>{content}</Markdown>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">미리볼 내용이 없습니다</p>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onSave} loading={saving} loadingText="저장 중...">
            저장
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
