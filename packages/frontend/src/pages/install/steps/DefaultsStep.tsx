import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Folder, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { extractApiError } from '@/utils/toast';
import { WizardNav } from '../WizardNav';

interface Service {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
}

interface RootFolder {
  path: string;
  freeSpace?: number;
  accessible?: boolean;
}

interface QualityOption {
  id: number;
  label: string;
}

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function DefaultsStep({ onNext, onBack }: Readonly<Props>) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [foldersByService, setFoldersByService] = useState<Record<number, RootFolder[]>>({});
  const [movieFolder, setMovieFolder] = useState('');
  const [tvFolder, setTvFolder] = useState('');
  const [animeFolder, setAnimeFolder] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [svcRes, qRes] = await Promise.all([
          api.get<Service[]>('/admin/services'),
          api.get<QualityOption[]>('/admin/quality-options'),
        ]);
        const arr = svcRes.data.filter((s) => (s.type === 'radarr' || s.type === 'sonarr') && s.enabled);
        setServices(arr);
        setQualityOptions(qRes.data);

        // Pull root folders per service, propose first as default for the matching media type.
        const foldersMap: Record<number, RootFolder[]> = {};
        let firstRadarrPath = '';
        let firstSonarrPath = '';
        await Promise.all(arr.map(async (svc) => {
          try {
            const { data } = await api.get<RootFolder[]>(`/admin/services/${svc.id}/rootfolders`);
            foldersMap[svc.id] = data;
            if (!firstRadarrPath && svc.type === 'radarr' && data[0]?.path) firstRadarrPath = data[0].path;
            if (!firstSonarrPath && svc.type === 'sonarr' && data[0]?.path) firstSonarrPath = data[0].path;
          } catch { foldersMap[svc.id] = []; }
        }));
        setFoldersByService(foldersMap);
        if (firstRadarrPath) setMovieFolder(firstRadarrPath);
        if (firstSonarrPath) setTvFolder(firstSonarrPath);
      } catch (err) {
        setError(extractApiError(err, t('common.error')));
      } finally { setLoading(false); }
    })();
  }, [t]);

  const seedQuality = async () => {
    setSeeding(true);
    try {
      await api.post('/admin/quality-options/seed');
      // Also auto-map tier ↔ profile so the wizard leaves a fully wired Quality config
      // behind (label, profile and service all stitched together). Idempotent on the back.
      await api.post('/admin/quality-mappings/auto');
      const { data } = await api.get<QualityOption[]>('/admin/quality-options');
      setQualityOptions(data);
    } catch (err) {
      setError(extractApiError(err, t('common.error')));
    } finally { setSeeding(false); }
  };

  const allRadarrFolders = services
    .filter((s) => s.type === 'radarr')
    .flatMap((s) => (foldersByService[s.id] || []).map((f) => ({ svc: s, path: f.path })));
  const allSonarrFolders = services
    .filter((s) => s.type === 'sonarr')
    .flatMap((s) => (foldersByService[s.id] || []).map((f) => ({ svc: s, path: f.path })));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (qualityOptions.length === 0) await seedQuality();
      else await api.post('/admin/quality-mappings/auto');
      await api.put('/admin/settings', {
        defaultMovieFolder: movieFolder || undefined,
        defaultTvFolder: tvFolder || undefined,
        defaultAnimeFolder: animeFolder || undefined,
      });
      onNext();
    } catch (err) {
      setError(extractApiError(err, t('common.error')));
    } finally { setSaving(false); }
  };

  const canContinue = qualityOptions.length > 0 || !loading;
  const hasFolderChoice = allRadarrFolders.length > 0 || allSonarrFolders.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-ndp-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-ndp-text">{t('install.defaults.title')}</h2>
        <p className="text-sm text-ndp-text-muted">{t('install.defaults.desc')}</p>
      </header>

      {/* ── Quality section ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ndp-text">
          <Sparkles className="w-4 h-4 text-ndp-accent" />
          <h3 className="text-sm font-semibold">{t('install.defaults.quality_title')}</h3>
        </div>
        {qualityOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {qualityOptions.map((q) => (
              <span key={q.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-ndp-success/10 text-ndp-success font-medium">
                <CheckCircle className="w-3 h-3" />
                {q.label}
              </span>
            ))}
          </div>
        ) : (
          <button type="button" onClick={seedQuality} disabled={seeding} className="btn-secondary text-sm flex items-center gap-2">
            {seeding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('install.defaults.quality_seed')}
          </button>
        )}
        <p className="text-xs text-ndp-text-dim">{t('install.defaults.quality_help')}</p>
      </section>

      {/* ── Folders section ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ndp-text">
          <Folder className="w-4 h-4 text-ndp-accent" />
          <h3 className="text-sm font-semibold">{t('install.defaults.folders_title')}</h3>
        </div>
        {hasFolderChoice ? (
          <div className="space-y-3">
            <FolderPicker
              label={t('install.defaults.folder_movies')}
              value={movieFolder}
              onChange={setMovieFolder}
              options={allRadarrFolders}
              emptyKey="install.defaults.no_radarr_folders"
              t={t}
            />
            <FolderPicker
              label={t('install.defaults.folder_tv')}
              value={tvFolder}
              onChange={setTvFolder}
              options={allSonarrFolders}
              emptyKey="install.defaults.no_sonarr_folders"
              t={t}
            />
            <FolderPicker
              label={`${t('install.defaults.folder_anime')} (${t('install.defaults.optional')})`}
              value={animeFolder}
              onChange={setAnimeFolder}
              options={allSonarrFolders}
              emptyKey="install.defaults.no_sonarr_folders"
              t={t}
              optional
            />
          </div>
        ) : (
          <p className="text-xs text-ndp-text-dim">{t('install.defaults.no_folders')}</p>
        )}
      </section>

      {error && <div className="text-xs px-3 py-2 rounded-lg bg-ndp-danger/10 text-ndp-danger">{error}</div>}

      <WizardNav onBack={onBack} onNext={save} nextDisabled={!canContinue} nextLoading={saving} />
    </div>
  );
}

interface FolderPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { svc: Service; path: string }[];
  emptyKey: string;
  t: (key: string) => string;
  optional?: boolean;
}

function FolderPicker({ label, value, onChange, options, emptyKey, t, optional }: Readonly<FolderPickerProps>) {
  if (options.length === 0) {
    return (
      <div>
        <span className="text-xs font-medium text-ndp-text block mb-1">{label}</span>
        <p className="text-xs text-ndp-text-dim">{t(emptyKey)}</p>
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs font-medium text-ndp-text block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full text-sm"
      >
        {optional && <option value="">—</option>}
        {options.map((o) => (
          <option key={`${o.svc.id}-${o.path}`} value={o.path}>{o.path} ({o.svc.name})</option>
        ))}
      </select>
    </div>
  );
}
