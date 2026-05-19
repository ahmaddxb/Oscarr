import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { extractApiError } from '@/utils/toast';
import { WizardNav } from '../WizardNav';

export type SeerrSource = 'overseerr' | 'jellyseerr' | 'seerr';

export interface SeerrCreds {
  source: SeerrSource;
  url: string;
  apiKey: string;
}

export interface DerivedConfig {
  reachable: boolean;
  version?: string;
  locale?: string;
  region?: string;
  radarr: Array<{ url: string; profile?: string; rootFolder?: string }>;
  sonarr: Array<{ url: string; profile?: string; rootFolder?: string }>;
  plexHint?: { url?: string };
  manualFollowUps: string[];
}

interface Props {
  onProbed: (creds: SeerrCreds, derived: DerivedConfig) => void;
  onBack: () => void;
}

export default function MigrateSourceStep({ onProbed, onBack }: Readonly<Props>) {
  const { t } = useTranslation();
  const [source, setSource] = useState<SeerrSource>('overseerr');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState('');

  const probe = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbing(true);
    setError('');
    try {
      const creds: SeerrCreds = { source, url: url.trim(), apiKey: apiKey.trim() };
      const { data } = await api.post<DerivedConfig>('/admin/import/config-probe', creds);
      if (!data.reachable) {
        setError(t('install.migrate.unreachable'));
        return;
      }
      onProbed(creds, data);
    } catch (err) {
      setError(extractApiError(err, t('install.migrate.probe_failed')));
    } finally { setProbing(false); }
  };

  const canSubmit = url.trim().length > 0 && apiKey.trim().length > 0;

  return (
    <form onSubmit={probe} className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-ndp-text">{t('install.migrate.source_title')}</h2>
        <p className="text-sm text-ndp-text-muted">{t('install.migrate.source_desc')}</p>
      </header>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-ndp-text block mb-1">{t('install.migrate.source')}</label>
          <div className="flex gap-1 bg-ndp-surface-light rounded-lg p-1">
            {(['overseerr', 'jellyseerr', 'seerr'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
                  source === s ? 'bg-ndp-accent/20 text-ndp-accent' : 'text-ndp-text-dim hover:text-ndp-text-muted'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="migrate-url" className="text-xs font-medium text-ndp-text block mb-1">{t('common.url')}</label>
          <input
            id="migrate-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://overseerr.example.com"
            className="input w-full text-sm"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="migrate-key" className="text-xs font-medium text-ndp-text block mb-1">{t('common.api_key')}</label>
          <input
            id="migrate-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="X-Api-Key"
            className="input w-full text-sm"
            autoComplete="off"
          />
        </div>
      </div>

      <p className="text-xs text-ndp-text-dim flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-ndp-success" />
        {t('install.migrate.probe_note')}
      </p>

      {error && <div className="text-xs px-3 py-2 rounded-lg bg-ndp-danger/10 text-ndp-danger">{error}</div>}

      <button type="submit" disabled={!canSubmit || probing} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
        {probing && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('install.migrate.probe')}
      </button>

      <WizardNav onBack={onBack} />
    </form>
  );
}
