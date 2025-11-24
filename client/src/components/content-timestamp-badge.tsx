import React from 'react';
import { Calendar, Clock } from '@/components/icons';

interface ContentTimestampBadgeProps {
  /** Erfassungsdatum des Inhalts */
  capturedAt?: Date | string | null;
  /** Veröffentlichungsdatum der Originalquelle */
  publishedAt?: Date | string | null;
  /** Kompakte Darstellung (nur Icons + Datum) */
  compact?: boolean;
  /** CSS-Klassen für Container */
  className?: string;
}

/**
 * Badge-Komponente zur Anzeige von Erfassungs- und Veröffentlichungsdaten
 * für regulatorische Updates, Dokumente, etc.
 *
 * @example
 * <ContentTimestampBadge
 *   capturedAt="2024-01-15T10:30:00Z"
 *   publishedAt="2024-01-10T08:00:00Z"
 * />
 */
export function ContentTimestampBadge({
  capturedAt,
  publishedAt,
  compact = false,
  className = ''
}: ContentTimestampBadgeProps) {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-xs text-gray-600 ${className}`}>
        {publishedAt && (
          <div className="flex items-center gap-1" title={`Veröffentlicht: ${formatDateTime(publishedAt)}`}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(publishedAt)}</span>
          </div>
        )}
        {capturedAt && (
          <div className="flex items-center gap-1" title={`Erfasst: ${formatDateTime(capturedAt)}`}>
            <Clock className="h-3 w-3" />
            <span>{formatDate(capturedAt)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-4 ${className}`}>
      {publishedAt && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-semibold">Veröffentlicht:</span>
          <span>{formatDate(publishedAt)}</span>
        </div>
      )}
      {capturedAt && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-semibold">Erfasst:</span>
          <span>{formatDate(capturedAt)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Badge für Listen mit "neueste zuerst" Sortierungshinweis
 */
export function SortedByDateBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium ${className}`}>
      <Clock className="h-3 w-3" />
      <span>Neueste zuerst</span>
    </div>
  );
}

export default ContentTimestampBadge;
