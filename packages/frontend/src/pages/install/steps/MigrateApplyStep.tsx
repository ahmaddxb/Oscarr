import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { extractApiError } from '@/utils/toast';
import { ImportFlow } from '../../admin/ImportFlow';
import type { DerivedConfig, SeerrCreds } from './MigrateSourceStep';
import { WizardNav } from '../WizardNav';

interface Props {
  creds: SeerrCreds;
  derived: DerivedConfig;
  onComplete: () => void;
  onBack: () => void;
}

export default function MigrateApplyStep({ creds, derived, onComplete, onBack }: Readonly<Props>) {
  const { t } = useTranslation();
  const [applying, setApplying] = useState(false);
  const [configApplied, setConfigApplied] = useState(false);
  const [error, setError] = useState('');

  const applyConfig = async () => {
    setApplying(true);
    setError('');
    try {
      await api.post('/admin/import/config-execute', creds);
      setConfigApplied(true);
    } catch (err) {
      setError(extractApiError(err, t('install.migrate.apply_failed')));
    } finally { setApplying(false); }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-ndp-text">{t('install.migrate.apply_title')}</h2>
        <p className="text-sm text-ndp-text-muted">{t('install.migrate.apply_desc')}</p>
      </header>

      {/* Config summary */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-ndp-text-dim uppercase tracking-wider">
          {t('install.migrate.config_summary')}
        </p>
        <ul className="space-y-1 text-sm">
          {derived.version && <Row label={t('install.migrate.version')} value={derived.version} />}
          {derived.locale && <Row label={t('install.migrate.locale')} value={derived.locale} />}
          <Row label="Radarr" value={`${derived.radarr.length} instance(s)`} />
          <Row label="Sonarr" value={`${derived.sonarr.length} instance(s)`} />
          {derived.plexHint?.url && <Row label="Plex" value={derived.plexHint.url} />}
        </ul>
        {derived.manualFollowUps.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-ndp-warning/10 text-ndp-warning text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">{t('install.migrate.manual_followups')}</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                {derived.manualFollowUps.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Apply config CTA */}
      {!configApplied ? (
        <div className="space-y-2">
          {error && <div className="text-xs px-3 py-2 rounded-lg bg-ndp-danger/10 text-ndp-danger">{error}</div>}
          <button
            type="button"
            onClick={applyConfig}
            disabled={applying}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {applying && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('install.migrate.apply_config')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-ndp-success/10 border border-ndp-success/20 rounded-xl text-ndp-success text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {t('install.migrate.config_applied')}
          </div>

          <section className="space-y-2">
            <p className="text-xs font-medium text-ndp-text-dim uppercase tracking-wider">
              {t('install.migrate.users_requests')}
            </p>
            <ImportFlow onDone={onComplete} />
          </section>
        </div>
      )}

      {configApplied && (
        <button type="button" onClick={onComplete} className="btn-secondary text-sm w-full">
          {t('install.migrate.skip_users')}
        </button>
      )}

      <WizardNav onBack={onBack} onNext={configApplied ? onComplete : undefined} />
    </div>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <li className="flex items-center justify-between gap-3 text-ndp-text">
      <span className="text-ndp-text-dim">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </li>
  );
}
