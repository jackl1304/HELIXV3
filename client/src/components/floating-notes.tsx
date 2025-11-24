import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText as StickyNote,
  X,
  ChevronUp as Maximize2,
  ChevronDown as Minimize2,
  Save,
  Download as PrinterIcon,
  GripVertical,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FloatingNotesProps {
  /**
   * Kontext für Notizen (z.B. "projekt-123", "entwicklung-456")
   * Wird für localStorage-Key und API-Speicherung verwendet
   */
  context: string;

  /**
   * Seiten-Titel für Kontext (z.B. "Projektentwicklung MDR-Compliance")
   */
  pageTitle?: string;

  /**
   * Initial sichtbar oder minimiert
   */
  initiallyVisible?: boolean;
}

/**
 * Schwebender Notizblock-Widget
 *
 * Aufgabe: "bei prohjet entwicklung und produktentwicklung immer eine notizblock
 * hinzufügen der schwebend ist und alle selbst getippten infos behält und später
 * druckbar macht"
 *
 * Features:
 * - Schwebend/draggable über Seite
 * - Auto-Save in localStorage (alle 3 Sekunden)
 * - Synchronisierung mit Backend-DB
 * - Druckfunktion (PDF/Papier)
 * - Expandierbar/minimierbar
 * - Zeitstempel der letzten Änderung
 * - Persistiert zwischen Sessions
 *
 * Verwendung:
 * ```tsx
 * <FloatingNotes
 *   context="projekt-mdr-2025"
 *   pageTitle="Projektentwicklung MDR-Compliance"
 * />
 * ```
 */
export function FloatingNotes({
  context,
  pageTitle = 'Notizen',
  initiallyVisible = true
}: FloatingNotesProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const cardRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `floating-notes-${context}`;

  // Lade Notizen beim Mount
  useEffect(() => {
    loadNotes();
  }, [context]);

  // Auto-Save: 3 Sekunden nach letzter Änderung
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (content.trim()) {
        saveNotes();
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  // Lade Notizen aus localStorage und Backend
  const loadNotes = async () => {
    try {
      // Zuerst aus localStorage laden (schneller)
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        setContent(parsed.content || '');
        setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
        setPosition(parsed.position || { x: 20, y: 20 });
      }

      // Dann aus Backend nachladen (aktuellste Version)
      const response = await fetch(`/api/notes/${encodeURIComponent(context)}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
        setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
      }
    } catch (error) {
      console.error('[FloatingNotes] Load error:', error);
    }
  };

  // Speichere Notizen in localStorage und Backend
  const saveNotes = async () => {
    setIsSaving(true);
    const now = new Date();

    try {
      // In localStorage speichern (sofort)
      const dataToStore = {
        content,
        lastSaved: now.toISOString(),
        position,
        context,
        pageTitle,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));

      // In Backend speichern (async)
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          content,
          pageTitle,
          metadata: { position },
        }),
      });

      setLastSaved(now);
    } catch (error) {
      console.error('[FloatingNotes] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Drucken-Funktion
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Notizen: ${pageTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #1e40af;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 10px;
            }
            .meta {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .content {
              white-space: pre-wrap;
              line-height: 1.6;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <h1>${pageTitle}</h1>
          <div class="meta">
            <strong>Kontext:</strong> ${context}<br>
            <strong>Datum:</strong> ${new Date().toLocaleString('de-DE')}<br>
            ${lastSaved ? `<strong>Zuletzt gespeichert:</strong> ${lastSaved.toLocaleString('de-DE')}` : ''}
          </div>
          <div class="content">${content}</div>
          <div class="footer">
            Erstellt mit Helix Regulatory Intelligence Platform
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Drag-Funktionalität
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Begrenze auf Viewport
    const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 300);
    const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 400);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Position speichern
      localStorage.setItem(storageKey, JSON.stringify({
        content,
        lastSaved: lastSaved?.toISOString(),
        position,
        context,
        pageTitle,
      }));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isVisible) {
    // Minimierte Version (nur Icon)
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        title="Notizen öffnen"
      >
        <StickyNote className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      ref={cardRef}
      className={`fixed shadow-2xl z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded ? '600px' : '350px',
        maxHeight: isExpanded ? '700px' : '400px',
      }}
    >
      {/* Header mit Drag-Handle */}
      <CardHeader
        className="cursor-grab active:cursor-grabbing pb-3 bg-gradient-to-r from-blue-50 to-purple-50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <StickyNote className="h-4 w-4 text-blue-600" />
            {pageTitle}
          </CardTitle>
          <div className="flex items-center gap-1 no-drag">
            {isSaving && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1 animate-pulse" />
                Speichert...
              </Badge>
            )}
            {lastSaved && !isSaving && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {lastSaved.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Verkleinern' : 'Vergrößern'}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsVisible(false)}
              title="Minimieren"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-4 space-y-3 no-drag">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Notizen hier eingeben... (Auto-Save nach 3 Sekunden)"
          className="min-h-[200px] resize-none font-mono text-sm"
          style={{
            height: isExpanded ? '500px' : '250px'
          }}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={saveNotes}
            disabled={isSaving || !content.trim()}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Save className="h-3 w-3 mr-1" />
            Manuell Speichern
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!content.trim()}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <PrinterIcon className="h-3 w-3 mr-1" />
            Drucken
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Kontext: <code className="bg-muted px-1 rounded">{context}</code>
        </div>
      </CardContent>
    </Card>
  );
}
