import { supabase } from '@/lib/supabase';

// ============================================
// MOOD CHECK-IN OPERATIONS
// ============================================

/**
 * Create a new mood check-in for the current user
 */
export async function createCheckin(checkinData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User is not authenticated');

  const payload = {
    user_id: user.id,
    energy: Number(checkinData.energy),
    stress: Number(checkinData.stress),
    social: Number(checkinData.social),
    sleep: Number(checkinData.sleep),
    focus: checkinData.focus ? Number(checkinData.focus) : null,
    outlook: checkinData.outlook ? Number(checkinData.outlook) : null,
    overall_mood: Number(checkinData.overall_mood),
    free_text: checkinData.free_text || '',
    time_of_day: checkinData.time_of_day || 'morning',
    journal_response: checkinData.journal_response || null,
    ai_activity: checkinData.ai_activity || null,
    ai_playlist: checkinData.ai_playlist || null,
    ai_food: checkinData.ai_food || null,
    ai_message: checkinData.ai_message || null,
    ai_journal_prompt: checkinData.ai_journal_prompt || null,
    checkin_date: checkinData.checkin_date || new Date().toISOString().split('T')[0],
  };

  const { data, error } = await supabase
    .from('mood_checkins')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Retrieve a single check-in by its ID
 */
export async function getCheckinById(id) {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*, profiles(email, display_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Retrieve check-ins for a user
 */
export async function getUserCheckins(userId, limit = 365) {
  let query = supabase
    .from('mood_checkins')
    .select('*')
    .order('checkin_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update an existing check-in by ID
 */
export async function updateCheckin(id, updateData) {
  const { data, error } = await supabase
    .from('mood_checkins')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a check-in by ID
 */
export async function deleteCheckin(id) {
  const { error } = await supabase
    .from('mood_checkins')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Bulk insert check-ins (used for CSV import)
 */
export async function bulkInsertCheckins(records) {
  const { data, error } = await supabase
    .from('mood_checkins')
    .insert(records)
    .select();

  if (error) throw error;
  return data;
}

// ============================================
// ADMIN SPECIFIC OPERATIONS
// ============================================

/**
 * Retrieve all check-ins across all users (Admin only)
 */
export async function getAllCheckins() {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*, profiles(id, email, display_name, avatar_url, role)')
    .order('checkin_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Retrieve all profiles (Admin only)
 */
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get App Settings (Admin only)
 */
export async function getAppSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*');

  if (error) throw error;
  
  const settingsMap = {};
  data?.forEach(row => {
    settingsMap[row.key] = row.value;
  });
  return settingsMap;
}

/**
 * Update an App Setting by key (Admin only)
 */
export async function updateAppSetting(key, value) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('app_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }, { onConflict: 'key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// AI RECOMMENDATIONS CALL
// ============================================

/**
 * Request AI recommendation via Vercel Serverless Function
 */
export async function fetchAIRecommendations(checkinData, lang = 'en') {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const response = await fetch('/api/ai/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      checkin: checkinData,
      lang,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `AI recommendation request failed (${response.status})`);
  }

  const result = await response.json();
  return result;
}
