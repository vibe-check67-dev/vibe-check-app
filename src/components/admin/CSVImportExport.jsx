import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/context/LanguageContext';
import { bulkInsertCheckins } from '@/lib/database';

export default function CSVImportExport({ checkins = [], onImportComplete }) {
  const { t, lang } = useLang();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // ============================================
  // EXPORT CSV
  // ============================================
  const handleExport = () => {
    if (!checkins || checkins.length === 0) return;

    const dataToExport = checkins.map((item) => ({
      id: item.id || '',
      user_id: item.user_id || '',
      user_email: item.profiles?.email || '',
      user_name: item.profiles?.display_name || '',
      checkin_date: item.checkin_date || '',
      checkin_time: item.checkin_time || '',
      time_of_day: item.time_of_day || '',
      overall_mood: item.overall_mood || '',
      energy: item.energy || '',
      stress: item.stress || '',
      social: item.social || '',
      sleep: item.sleep || '',
      focus: item.focus || '',
      outlook: item.outlook || '',
      free_text: item.free_text || '',
      journal_response: item.journal_response || '',
      ai_activity: item.ai_activity || '',
      ai_playlist: item.ai_playlist || '',
      ai_food: item.ai_food || '',
      ai_message: item.ai_message || '',
      ai_journal_prompt: item.ai_journal_prompt || '',
      created_at: item.created_at || '',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel Thai support
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe_checkins_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================
  // IMPORT CSV
  // ============================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file is empty or has no valid rows');
          }

          // Clean and format rows
          const rowsToInsert = results.data
            .filter((row) => row.user_id && row.energy && row.overall_mood)
            .map((row) => ({
              user_id: row.user_id,
              energy: parseInt(row.energy, 10) || 3,
              stress: parseInt(row.stress, 10) || 3,
              social: parseInt(row.social, 10) || 3,
              sleep: parseInt(row.sleep, 10) || 3,
              focus: row.focus ? parseInt(row.focus, 10) : null,
              outlook: row.outlook ? parseInt(row.outlook, 10) : null,
              overall_mood: parseInt(row.overall_mood, 10) || 3,
              free_text: row.free_text || '',
              time_of_day: ['morning', 'afternoon', 'evening'].includes(row.time_of_day)
                ? row.time_of_day
                : 'morning',
              journal_response: row.journal_response || null,
              ai_activity: row.ai_activity || null,
              ai_playlist: row.ai_playlist || null,
              ai_food: row.ai_food || null,
              ai_message: row.ai_message || null,
              ai_journal_prompt: row.ai_journal_prompt || null,
              checkin_date: row.checkin_date || format(new Date(), 'yyyy-MM-dd'),
              checkin_time: row.checkin_time || '12:00',
            }));

          if (rowsToInsert.length === 0) {
            throw new Error('No valid records found in CSV. Required columns: user_id, energy, overall_mood');
          }

          await bulkInsertCheckins(rowsToInsert);

          setStatusMessage({
            type: 'success',
            text: lang === 'th'
              ? `นำเข้าข้อมูลสำเร็จ ${rowsToInsert.length} รายการ`
              : `Successfully imported ${rowsToInsert.length} records`,
          });

          if (onImportComplete) {
            onImportComplete();
          }
        } catch (err) {
          console.error('CSV import error:', err);
          setStatusMessage({
            type: 'error',
            text: err.message || 'Failed to import CSV file',
          });
        } finally {
          setImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (parseErr) => {
        setImporting(false);
        setStatusMessage({
          type: 'error',
          text: parseErr.message || 'Failed to parse CSV file',
        });
      },
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!checkins.length}
          className="rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-brand-600" />
          {t('exportCSVBtn')} ({checkins.length})
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-brand-600" />
          )}
          {importing ? (lang === 'th' ? 'กำลังนำเข้า...' : 'Importing...') : t('importCSV')}
        </Button>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
