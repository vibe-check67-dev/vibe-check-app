import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, Edit, Trash2, Plus, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLang } from '@/context/LanguageContext';
import { updateCheckin, deleteCheckin, createCheckin } from '@/lib/database';

export default function DataTable({ checkins = [], profiles = [], onDataMutated }) {
  const { t, lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    user_id: '',
    energy: 3,
    stress: 3,
    social: 3,
    sleep: 3,
    focus: 3,
    outlook: 3,
    overall_mood: 3,
    free_text: '',
    time_of_day: 'morning',
    checkin_date: format(new Date(), 'yyyy-MM-dd'),
    checkin_time: '12:00',
  });

  // Filter checkins by search term
  const filtered = checkins.filter((item) => {
    const q = searchTerm.toLowerCase();
    const email = item.profiles?.email?.toLowerCase() || '';
    const name = item.profiles?.display_name?.toLowerCase() || '';
    const note = item.free_text?.toLowerCase() || '';
    const date = item.checkin_date || '';
    return email.includes(q) || name.includes(q) || note.includes(q) || date.includes(q);
  });

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      user_id: item.user_id,
      energy: item.energy || 3,
      stress: item.stress || 3,
      social: item.social || 3,
      sleep: item.sleep || 3,
      focus: item.focus || 3,
      outlook: item.outlook || 3,
      overall_mood: item.overall_mood || 3,
      free_text: item.free_text || '',
      time_of_day: item.time_of_day || 'morning',
      checkin_date: item.checkin_date || format(new Date(), 'yyyy-MM-dd'),
      checkin_time: item.checkin_time ? item.checkin_time.slice(0, 5) : '12:00',
    });
  };

  const openAddModal = () => {
    setIsAddingNew(true);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormData({
      user_id: profiles[0]?.id || '',
      energy: 3,
      stress: 3,
      social: 3,
      sleep: 3,
      focus: 3,
      outlook: 3,
      overall_mood: 3,
      free_text: '',
      time_of_day: 'morning',
      checkin_date: format(new Date(), 'yyyy-MM-dd'),
      checkin_time: `${hours}:${minutes}`,
    });
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await updateCheckin(editingItem.id, {
          energy: Number(formData.energy),
          stress: Number(formData.stress),
          social: Number(formData.social),
          sleep: Number(formData.sleep),
          focus: Number(formData.focus),
          outlook: Number(formData.outlook),
          overall_mood: Number(formData.overall_mood),
          free_text: formData.free_text,
          time_of_day: formData.time_of_day,
          checkin_date: formData.checkin_date,
          checkin_time: formData.checkin_time || '12:00',
        });
      } else if (isAddingNew) {
        await createCheckin(formData);
      }

      setEditingItem(null);
      setIsAddingNew(false);
      if (onDataMutated) onDataMutated();
    } catch (err) {
      console.error('Error saving checkin:', err);
      alert(err.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCheckin(id);
      setDeleteConfirmId(null);
      if (onDataMutated) onDataMutated();
    } catch (err) {
      console.error('Error deleting checkin:', err);
      alert(err.message || 'Failed to delete record');
    }
  };

  const getMoodBadgeClass = (val) => {
    const v = Number(val);
    if (v >= 4) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (v === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="bg-card rounded-2xl border shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs sm:text-sm bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openAddModal}
            className="rounded-xl h-10 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {t('addNewRecord')}
          </Button>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/80 text-muted-foreground font-semibold">
              <th className="py-3 px-3.5 whitespace-nowrap">{t('date')}</th>
              <th className="py-3 px-3.5 whitespace-nowrap">{t('userCol')}</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">{t('kpiAvgMood')}</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">{t('energy')}</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">{t('stress')}</th>
              <th className="py-3 px-2 text-center whitespace-nowrap">{t('sleep')}</th>
              <th className="py-3 px-3.5 whitespace-nowrap">{t('timeOfDayCol')}</th>
              <th className="py-3 px-3.5 max-w-xs">{t('note')}</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-3.5 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                    <div>{row.checkin_date}</div>
                    {row.checkin_time && (
                      <div className="text-[10px] text-muted-foreground">{row.checkin_time.slice(0, 5)}</div>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-foreground truncate max-w-[150px]">
                      {row.profiles?.display_name || row.profiles?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                      {row.profiles?.email}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${getMoodBadgeClass(row.overall_mood)}`}>
                      {row.overall_mood}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">{row.energy}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">{row.stress}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">{row.sleep}</td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-secondary-foreground">
                      {row.time_of_day}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">
                    {row.free_text || '-'}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title={t('editRecord')}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(row.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        title={t('deleteRecord')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record count footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          {lang === 'th' ? 'แสดง' : 'Showing'} {filtered.length} {lang === 'th' ? 'จากทั้งหมด' : 'of'}{' '}
          {checkins.length} {lang === 'th' ? 'รายการ' : 'records'}
        </span>
      </div>

      {/* Edit / Add Modal Dialog */}
      <Dialog
        open={!!editingItem || isAddingNew}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setIsAddingNew(false);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingItem ? t('editRecord') : t('addNewRecord')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-3.5 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{t('date')}</Label>
                <Input
                  type="date"
                  value={formData.checkin_date}
                  onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">{t('time') || (lang === 'th' ? 'เวลา' : 'Time')}</Label>
                <Input
                  type="time"
                  value={formData.checkin_time || '12:00'}
                  onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">{t('timeOfDayCol')}</Label>
                <select
                  value={formData.time_of_day}
                  onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                  className="w-full h-9 rounded-xl text-xs mt-1 border bg-background px-2"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            {/* Metric Sliders/Inputs */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label className="text-[11px]">{t('kpiAvgMood')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.overall_mood}
                  onChange={(e) => setFormData({ ...formData, overall_mood: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-[11px]">{t('energy')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.energy}
                  onChange={(e) => setFormData({ ...formData, energy: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-[11px]">{t('stress')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.stress}
                  onChange={(e) => setFormData({ ...formData, stress: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label className="text-[11px]">{t('sleep')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.sleep}
                  onChange={(e) => setFormData({ ...formData, sleep: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-[11px]">{t('focus')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px]">{t('outlook')} (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.outlook}
                  onChange={(e) => setFormData({ ...formData, outlook: e.target.value })}
                  className="h-9 rounded-xl text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{t('note')} (max 100 chars)</Label>
              <Textarea
                value={formData.free_text}
                onChange={(e) => setFormData({ ...formData, free_text: e.target.value.slice(0, 100) })}
                className="h-16 rounded-xl text-xs mt-1"
                maxLength={100}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="rounded-xl h-9 text-xs"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="rounded-xl h-9 text-xs gap-1.5">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">
              {t('deleteRecord')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            {t('deleteConfirm')}
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl h-9 text-xs"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(deleteConfirmId)}
              className="rounded-xl h-9 text-xs"
            >
              {t('deleteRecord')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
