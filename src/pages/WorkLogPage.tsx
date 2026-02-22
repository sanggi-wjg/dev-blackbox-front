import {useState} from 'react';
import dayjs from 'dayjs';
import {useQueryClient} from '@tanstack/react-query';
import {useGetUsersUsersGet} from '@/api/generated/user/user';
import {
    useGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGet,
    getGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGetQueryKey,
    useSyncWorkLogsWorkLogsUserIdManualSyncPost,
} from '@/api/generated/work-log/work-log';
import UserSelect from '@/components/user/UserSelect';
import SummaryDatePicker from '@/components/summary/SummaryDatePicker';
import SummaryCard from '@/components/summary/SummaryCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import EmptyState from '@/components/common/EmptyState';
import {SummaryCardSkeleton} from '@/components/common/Skeleton';
import {useToast} from '@/components/common/Toast';

export default function WorkLogPage() {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [targetDate, setTargetDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const queryClient = useQueryClient();
    const {toast} = useToast();

    const {data: users, isLoading: usersLoading, error: usersError} = useGetUsersUsersGet();

    const {
        data: workLogs,
        isLoading: workLogsLoading,
        error: workLogsError,
    } = useGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGet(
        selectedUserId!,
        {target_date: targetDate},
        {query: {enabled: selectedUserId != null}},
    );

    const manualSync = useSyncWorkLogsWorkLogsUserIdManualSyncPost();

    const handleCollect = () => {
        if (selectedUserId == null) return;
        manualSync.mutate(
            {
                userId: selectedUserId,
                data: {target_date: targetDate},
            },
            {
                onSuccess: (data) => {
                    toast('success', data.message);
                    queryClient.invalidateQueries({
                        queryKey: getGetPlatformWorkLogsWorkLogsUsersUserIdPlatformsGetQueryKey(
                            selectedUserId,
                            {target_date: targetDate},
                        ),
                    });
                },
                onError: (err) => {
                    toast('error', err instanceof Error ? err.message : '수집에 실패했습니다');
                },
            },
        );
    };

    const showCollectButton =
        selectedUserId != null &&
        !workLogsLoading &&
        workLogs != null &&
        workLogs.length === 0;

    return (
        <div>
            <div className="mb-6 flex min-h-10 items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">업무일지</h2>
                <button
                    onClick={handleCollect}
                    disabled={manualSync.isPending}
                    className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 ${
                        showCollectButton ? '' : 'invisible'
                    }`}
                >
                    {manualSync.isPending ? '수집 중...' : '수동 수집'}
                </button>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4">
                {usersLoading && (
                    <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200"/>
                )}
                {usersError != null && <ErrorMessage error={usersError}/>}
                {users && (
                    <UserSelect
                        users={users}
                        selectedUserId={selectedUserId}
                        onChange={setSelectedUserId}
                    />
                )}
                <SummaryDatePicker date={targetDate} onChange={setTargetDate}/>
            </div>

            {selectedUserId == null && (
                <EmptyState message="사용자를 선택해주세요"/>
            )}

            {selectedUserId != null && workLogsLoading && (
                <div className="flex flex-col gap-4">
                    <SummaryCardSkeleton/>
                    <SummaryCardSkeleton/>
                </div>
            )}

            {workLogsError != null && <ErrorMessage error={workLogsError}/>}

            {workLogs && workLogs.length === 0 && (
                <EmptyState message="해당 날짜에 요약 데이터가 없습니다"/>
            )}

            {workLogs && workLogs.length > 0 && (
                <div className="flex flex-col gap-4">
                    {workLogs.map((s) => (
                        <SummaryCard key={s.id} platform={s.platform} summary={s.summary}/>
                    ))}
                </div>
            )}
        </div>
    );
}
