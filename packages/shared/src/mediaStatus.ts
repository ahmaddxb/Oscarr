import type { RequestStatusKind } from './requestStatus.js';

/**
 * Status d'un media tel qu'il est écrit dans la DB (`Media.status` Prisma column).
 * - 'unknown' : pas encore tracké
 * - 'upcoming' : sortie future (Radarr.movie.status='announced' / 'rumored')
 * - 'searching' : *arr cherche un release
 * - 'processing' : download en cours (ou partiel pour TV)
 * - 'available' : dispo sur le serveur media (Plex/Jellyfin/Emby)
 * - 'deleted' : retiré (réservé, pas écrit aujourd'hui — voir M7 schema comment)
 */
export const MEDIA_STATUS_VALUES = [
  'unknown',
  'upcoming',
  'searching',
  'processing',
  'available',
  'deleted',
] as const;

export type MediaStatusKind = typeof MEDIA_STATUS_VALUES[number];

/**
 * Shape du objet `availability` retourné sur le wire par GET /api/media,
 * GET /api/media/:id, GET /api/tmdb/*, et batch GET /api/media/status.
 * Combine `Media.status` + `MediaRequest.status` (si une request existe pour
 * ce media + cet utilisateur).
 */
export interface Availability {
  status: MediaStatusKind;
  requestStatus?: RequestStatusKind | null;
  requestId?: number | null;
  /**
   * Pour les TV partiellement dispos : nombre d'épisodes available vs total.
   * Présent uniquement quand status === 'processing' && mediaType === 'tv'.
   */
  episodes?: { available: number; total: number } | null;
}

/**
 * Tagged union consommé par le frontend pour décider quoi rendre (badge,
 * action button, indicateurs). Produit par `useMediaUIState`.
 *
 * Chaque kind contient juste les données nécessaires au render — un consumer
 * fait `switch (state.kind) { ... }`, le compilateur garantit l'exhaustivité.
 */
export type MediaUIState =
  | { kind: 'unknown' }
  | { kind: 'not_requested' }
  | { kind: 'upcoming' }
  | { kind: 'pending_approval'; requestId: number }
  | { kind: 'declined'; requestId: number }
  | { kind: 'searching'; requestId: number }
  | { kind: 'processing'; requestId: number }
  | { kind: 'partially_available'; episodes: { available: number; total: number } }
  | { kind: 'available' }
  | { kind: 'available_can_request_quality' }
  | { kind: 'failed'; requestId: number; retryable: boolean }
  | { kind: 'blacklisted' };
