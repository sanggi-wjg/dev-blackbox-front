import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTokenLoginApiV1AuthTokenPost } from '@/api/generated/auth/auth';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useTokenLoginApiV1AuthTokenPost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(
      {
        data: {
          username: email,
          password,
        },
      },
      {
        onSuccess: (data) => {
          login(data.access_token);
          navigate('/', { replace: true });
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-text-inverse">
            DB
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Dev Blackbox</h1>
          <p className="mt-1 text-sm text-text-secondary">로그인하여 업무일지를 확인하세요</p>
        </div>

        <div className="rounded-xl border border-border-primary bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="이메일" htmlFor="login-email">
              <Input
                id="login-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </FormField>

            <FormField label="비밀번호" htmlFor="login-password">
              <Input
                id="login-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
            </FormField>

            {error && (
              <p className="text-sm text-danger-600">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
              loadingText="로그인 중..."
            >
              로그인
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
