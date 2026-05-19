import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import api, { setSetupSecret as setApiSetupSecret } from '@/lib/api';

interface Props {
  onValidated: (adminExists: boolean) => void;
}

export default function SecretStep({ onValidated }: Readonly<Props>) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || submitting) return;
    setSubmitting(true);
    setApiSetupSecret(value);
    setError('');
    try {
      const { data } = await api.post('/setup/verify-secret');
      onValidated(Boolean(data?.adminExists));
    } catch {
      setError(t('install.setup_secret_invalid'));
      setApiSetupSecret(null);
      setShake(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-ndp-text">{t('install.secret.title')}</h2>
        <p className="text-sm text-ndp-text-muted">{t('install.secret.desc')}</p>
      </header>
      <div>
        <label htmlFor="install-setup-secret" className="text-sm text-ndp-text mb-1.5 block font-medium">
          {t('install.setup_secret')}
        </label>
        <input
          id="install-setup-secret"
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          placeholder="SETUP_SECRET"
          className={`input w-full ${shake ? 'animate-shake border-ndp-danger' : ''}`}
          onAnimationEnd={() => setShake(false)}
          autoFocus
          autoComplete="off"
        />
        <p className="text-xs text-ndp-text-dim mt-1.5">{t('install.setup_secret_help')}</p>
      </div>
      {error && (
        <div className="text-xs px-3 py-2 rounded-lg bg-ndp-danger/10 text-ndp-danger">{error}</div>
      )}
      <button
        type="submit"
        disabled={!value || submitting}
        className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('common.next')}
      </button>
    </form>
  );
}
