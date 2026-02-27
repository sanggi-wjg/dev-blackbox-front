import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  useGetUserContentApiV1WorkLogsUserContentGet,
  useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut,
} from '@/api/generated/work-log/work-log';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import ManualWorkLogEditor from '@/components/worklog/ManualWorkLogEditor';
import { useToast } from '@/components/common/Toast';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ClipboardDocumentIcon } from '@/components/icons';

export default function ManualWorkLogPage() {
  const [targetDate, setTargetDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [manualContent, setManualContent] = useState('');
  const [syncedAt, setSyncedAt] = useState(0);
  const { toast } = useToast();

  const { dataUpdatedAt } = useGetUserContentApiV1WorkLogsUserContentGet(
    { target_date: targetDate },
    {
      query: {
        select: (data) => data?.content ?? '',
        // 서버 데이터 도착 시 에디터에 동기화하기 위해 dataUpdatedAt 추적
      },
    },
  );
  // dataUpdatedAt이 변하면 서버 데이터가 갱신된 것이므로 select된 content를 가져옴
  const { data: userContent } = useGetUserContentApiV1WorkLogsUserContentGet({ target_date: targetDate });

  // dataUpdatedAt 변경 시 에디터 콘텐츠 동기화
  if (dataUpdatedAt > 0 && dataUpdatedAt !== syncedAt) {
    setSyncedAt(dataUpdatedAt);
    setManualContent(userContent?.content ?? '');
  }

  const saveUserContent = useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut();

  const handleSaveManual = useCallback(() => {
    saveUserContent.mutate(
      { data: { target_date: targetDate, content: manualContent } },
      {
        onSuccess: () => {
          toast('success', '저장되었습니다');
        },
        onError: (err) => {
          toast('error', err instanceof Error ? err.message : '저장에 실패했습니다');
        },
      },
    );
  }, [targetDate, manualContent, toast, saveUserContent]);

  const handleCopyManual = () => {
    navigator.clipboard.writeText(manualContent).then(
      () => toast('success', '수기 업무일지 내용이 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">수기 업무일지</h2>
        <p className="mt-1 text-sm text-text-secondary">마크다운으로 업무일지를 직접 작성합니다</p>
      </div>

      {/* Control bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
          <div className="ml-auto flex items-center gap-2">
            {manualContent.trim() && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyManual}
                icon={<ClipboardDocumentIcon className="h-4 w-4" />}
              >
                복사
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveManual}
              loading={saveUserContent.isPending}
              loadingText="저장 중..."
            >
              저장
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <ManualWorkLogEditor
        content={manualContent}
        onChange={setManualContent}
        onSave={handleSaveManual}
        saving={saveUserContent.isPending}
        onCopy={manualContent.trim() ? handleCopyManual : undefined}
      />
    </div>
  );
}
