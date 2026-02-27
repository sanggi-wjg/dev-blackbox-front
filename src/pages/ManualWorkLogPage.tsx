import { useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  useGetUserContentApiV1WorkLogsUserContentGet,
  useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut,
} from '@/api/generated/work-log/work-log';
import WorkLogDatePicker from '@/components/worklog/WorkLogDatePicker';
import ManualWorkLogEditor from '@/components/worklog/ManualWorkLogEditor';
import { useToast } from '@/components/common/Toast';
import Card from '@/components/common/Card';

export default function ManualWorkLogPage() {
  const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [manualContent, setManualContent] = useState('');
  const { toast } = useToast();

  const { data: userContent } = useGetUserContentApiV1WorkLogsUserContentGet({ target_date: targetDate });

  const saveUserContent = useCreateOrUpdateUserContentApiV1WorkLogsUserContentPut();

  // 날짜 변경 또는 서버 데이터 도착 시 manualContent를 동기화
  useEffect(() => {
    if (userContent !== undefined) {
      setManualContent(userContent?.content ?? '');
    }
  }, [userContent, targetDate]);

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
      () => toast('success', '직접 작성 내용이 복사되었습니다'),
      () => toast('error', '복사에 실패했습니다'),
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">직접 작성</h2>
        <p className="mt-1 text-sm text-text-secondary">마크다운으로 업무일지를 직접 작성합니다</p>
      </div>

      {/* Control bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <WorkLogDatePicker date={targetDate} onChange={setTargetDate} />
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
