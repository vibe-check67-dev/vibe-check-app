import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, Loader2, Save, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLang } from '@/context/LanguageContext';
import { getAppSettings, updateAppSetting } from '@/lib/database';

const GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', label: 'gemini-3.7-flash (Recommended / Latest)', desc: 'Latest high-performance balanced model' },
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Ultra Fast)', desc: 'Ultra-fast low-latency model' },
  { id: 'gemini-3.6-flash', label: 'gemini-3.6-flash', desc: 'Latest preview flash model' },
  { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash', desc: 'Fast, high quality standard' },
  { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash', desc: 'Stable standard model' },
  { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro', desc: 'Deep reasoning and complex instructions' },
];

export default function AdminAISettings() {
  const { t, lang } = useLang();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.7-flash');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getAppSettings();
      if (settings.GEMINI_API_KEY) setApiKey(settings.GEMINI_API_KEY);
      if (settings.GEMINI_MODEL) setModel(settings.GEMINI_MODEL);
    } catch (err) {
      console.error('Error loading AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateAppSetting('GEMINI_API_KEY', apiKey.trim());
      await updateAppSetting('GEMINI_MODEL', model);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestResult({ success: false, message: lang === 'th' ? 'กรุณาใส่ API Key ก่อนทดสอบ' : 'Please enter an API Key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), model }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `${t('connectionSuccess')} (${model})`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || t('connectionFailed'),
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || t('connectionFailed'),
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card rounded-2xl border shadow-xs p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{t('tabAISettings')}</h3>
            <p className="text-xs text-muted-foreground">{t('aiSettingsDesc')}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* API Key input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="geminiApiKey" className="text-xs font-bold text-foreground">
                {t('geminiApiKeyLabel')}
              </Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:underline"
              >
                {lang === 'th' ? 'รับ API Key ฟรีที่ Google AI Studio ↗' : 'Get free API Key at Google AI Studio ↗'}
              </a>
            </div>

            <div className="relative">
              <Input
                id="geminiApiKey"
                type={showKey ? 'text' : 'password'}
                placeholder={t('geminiApiKeyPlaceholder')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 h-11 rounded-xl text-xs sm:text-sm font-mono bg-background"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              🔒 {lang === 'th' ? 'คีย์จะถูกจัดเก็บในฐานข้อมูล Supabase และเข้าถึงได้เฉพาะแอดมินเท่านั้น' : 'Key is stored securely in Supabase app_settings table protected by RLS.'}
            </p>
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <Label htmlFor="geminiModel" className="text-xs font-bold text-foreground">
              {t('geminiModelLabel')}
            </Label>
            <select
              id="geminiModel"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-11 rounded-xl text-xs sm:text-sm border bg-background px-3 font-medium cursor-pointer"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('settingsSaved')}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
              className="w-full sm:w-auto h-11 rounded-xl text-xs font-semibold gap-2 cursor-pointer"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4 text-brand-600" />}
              {testing ? (lang === 'th' ? 'กำลังทดสอบ...' : 'Testing...') : t('testConnection')}
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-11 rounded-xl text-xs font-semibold gap-2 cursor-pointer shadow-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t('saveSettings')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
