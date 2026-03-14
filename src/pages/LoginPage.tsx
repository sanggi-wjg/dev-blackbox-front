import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTokenLoginApiV1AuthTokenPost } from '@/api/generated/auth/auth';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation, validators } from '@/hooks/useFormValidation';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useTokenLoginApiV1AuthTokenPost();

  const rules = useMemo(
    () => ({
      email: validators.email('이메일'),
      password: validators.required('비밀번호'),
    }),
    [],
  );
  const { errors, serverError, validate, validateField, setServerError } = useFormValidation(rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ email, password })) return;
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
          setServerError(err instanceof Error ? err.message : '로그인에 실패했습니다');
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
            <FormField label="이메일" htmlFor="login-email" error={errors.email}>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateField('email', email)}
                error={!!errors.email}
                placeholder="user@example.com"
              />
            </FormField>

            <FormField label="비밀번호" htmlFor="login-password" error={errors.password}>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validateField('password', password)}
                error={!!errors.password}
                placeholder="비밀번호를 입력하세요"
              />
            </FormField>

            {serverError && (
              <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-600">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loginMutation.isPending} loadingText="로그인 중...">
              로그인
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
