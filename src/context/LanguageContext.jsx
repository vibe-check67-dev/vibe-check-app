import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  // App
  appName: { en: 'Vibe Check', th: 'Vibe Check' },
  
  // Nav
  home: { en: 'Home', th: 'หน้าแรก' },
  history: { en: 'History', th: 'ประวัติ' },
  checkin: { en: 'Check In', th: 'เช็คอิน' },
  admin: { en: 'Admin', th: 'แอดมิน' },
  adminPanel: { en: 'Admin Panel', th: 'ระบบหลังบ้าน' },
  profile: { en: 'Profile', th: 'โปรไฟล์' },
  logout: { en: 'Log Out', th: 'ออกจากระบบ' },
  language: { en: 'Language', th: 'ภาษา' },
  
  // Auth
  welcomeBack: { en: 'Welcome back', th: 'ยินดีต้อนรับกลับมา' },
  loginSubtitle: { en: 'Log in to your account', th: 'เข้าสู่ระบบเพื่อดำเนินการต่อ' },
  dontHaveAccount: { en: "Don't have an account?", th: 'ยังไม่มีบัญชีใช่ไหม?' },
  createOne: { en: 'Create one', th: 'สร้างบัญชีใหม่' },
  createAccount: { en: 'Create your account', th: 'สร้างบัญชีของคุณ' },
  registerSubtitle: { en: 'Sign up to start tracking your mood', th: 'ลงทะเบียนเพื่อเริ่มต้นติดตามอารมณ์ของคุณ' },
  alreadyHaveAccount: { en: 'Already have an account?', th: 'มีบัญชีอยู่แล้วใช่ไหม?' },
  continueWithGoogle: { en: 'Continue with Google', th: 'ดำเนินการต่อด้วย Google' },
  or: { en: 'or', th: 'หรือ' },
  email: { en: 'Email', th: 'อีเมล' },
  emailAddress: { en: 'Email address', th: 'ที่อยู่อีเมล' },
  password: { en: 'Password', th: 'รหัสผ่าน' },
  confirmPassword: { en: 'Confirm Password', th: 'ยืนยันรหัสผ่าน' },
  name: { en: 'Name', th: 'ชื่อ' },
  forgotPassword: { en: 'Forgot password?', th: 'ลืมรหัสผ่าน?' },
  resetPassword: { en: 'Reset password', th: 'รีเซ็ตรหัสผ่าน' },
  resetSubtitle: { en: "We'll send you a link to reset your password", th: 'เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ' },
  sendResetLink: { en: 'Send reset link', th: 'ส่งลิงก์รีเซ็ต' },
  sending: { en: 'Sending...', th: 'กำลังส่ง...' },
  linkSent: { en: 'Check your inbox', th: 'ตรวจสอบกล่องจดหมายของคุณ' },
  resetEmailSentDesc: { en: "If an account exists with that email, you'll receive a password reset link shortly.", th: 'หากมีบัญชีที่ตรงกับอีเมลนี้ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านในไม่ช้า' },
  backToLogin: { en: 'Back to log in', th: 'กลับไปหน้าเข้าสู่ระบบ' },
  newPassword: { en: 'New Password', th: 'รหัสผ่านใหม่' },
  newPasswordSubtitle: { en: 'Enter your new password below', th: 'ป้อนรหัสผ่านใหม่ของคุณด้านล่าง' },
  updatePassword: { en: 'Update password', th: 'อัปเดตรหัสผ่าน' },
  resetting: { en: 'Resetting...', th: 'กำลังรีเซ็ต...' },
  passwordUpdated: { en: 'Password updated', th: 'อัปเดตรหัสผ่านสำเร็จ' },
  passwordUpdateSuccess: { en: 'Your password has been successfully updated.', th: 'รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว' },
  redirecting: { en: 'Redirecting to your dashboard...', th: 'กำลังนำคุณไปยังหน้าหลัก...' },
  login: { en: 'Log in', th: 'เข้าสู่ระบบ' },
  loggingIn: { en: 'Logging in...', th: 'กำลังเข้าสู่ระบบ...' },
  creatingAccount: { en: 'Creating account...', th: 'กำลังสร้างบัญชี...' },
  checkYourEmail: { en: 'Check your email', th: 'ตรวจสอบอีเมลของคุณ' },
  confirmationSent: { en: 'We sent a confirmation link to your email', th: 'เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว' },
  confirmationDesc: { en: 'Please click the confirmation link sent to:', th: 'กรุณาคลิกลิงก์ยืนยันที่ส่งไปยัง:' },
  continueToLogin: { en: 'Continue to log in', th: 'ไปที่หน้าเข้าสู่ระบบ' },
  passwordMismatch: { en: 'Passwords do not match', th: 'รหัสผ่านไม่ตรงกัน' },
  passwordLengthError: { en: 'Password must be at least 6 characters', th: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
  
  // Onboarding
  onboard1Title: { en: 'Welcome to Vibe Check', th: 'ยินดีต้อนรับสู่ Vibe Check' },
  onboard1Desc: { en: 'Your daily 60-second mood check-in. Quick, easy, personal.', th: 'เช็คอินอารมณ์ประจำวันภายใน 60 วินาที ง่าย สะดวก เป็นส่วนตัว' },
  onboard2Title: { en: 'Get Personalized Tips', th: 'รับคำแนะนำเฉพาะคุณ' },
  onboard2Desc: { en: 'AI-powered activity, music, food, and wellness suggestions tailored to how you feel.', th: 'กิจกรรม เพลง อาหาร และเคล็ดลับสุขภาพจาก AI ที่ปรับตามอารมณ์คุณ' },
  onboard3Title: { en: 'Track Your Trends', th: 'ติดตามแนวโน้มของคุณ' },
  onboard3Desc: { en: 'See your mood patterns over time and build a wellness streak.', th: 'ดูแนวโน้มอารมณ์ของคุณในช่วงเวลาต่างๆ และสร้างสถิติสุขภาพ' },
  
  // Home
  howAreYou: { en: 'How are you feeling today?', th: 'วันนี้คุณรู้สึกอย่างไร?' },
  startCheckin: { en: 'Start Check-in', th: 'เริ่มเช็คอิน' },
  alreadyCheckedIn: { en: "You've already checked in today!", th: 'คุณเช็คอินวันนี้แล้ว!' },
  viewResults: { en: 'View Your Results', th: 'ดูผลลัพธ์ของคุณ' },
  dayStreak: { en: '-day streak', th: ' วันติดต่อกัน' },
  
  // Check-in
  energy: { en: 'Energy Level', th: 'ระดับพลังงาน' },
  stress: { en: 'Stress Level', th: 'ระดับความเครียด' },
  social: { en: 'Social Mood', th: 'อารมณ์ทางสังคม' },
  sleep: { en: 'Sleep Quality', th: 'คุณภาพการนอน' },
  focus: { en: 'Focus Level', th: 'โฟกัส/สมาธิวันนี้' },
  outlook: { en: 'Outlook on Tomorrow', th: 'มุมมองต่อวันพรุ่งนี้' },
  whatsOnMind: { en: "What's on your mind today?", th: 'วันนี้คุณคิดอะไรอยู่?' },
  whatsOnMindEvening: { en: "What was today's highlight?", th: 'ไฮไลท์ของวันนี้คืออะไร?' },
  optional: { en: 'Optional', th: 'ไม่บังคับ' },
  submit: { en: 'Submit', th: 'ส่ง' },
  next: { en: 'Next', th: 'ถัดไป' },
  back: { en: 'Back', th: 'ย้อนกลับ' },
  skip: { en: 'Skip', th: 'ข้าม' },
  getStarted: { en: 'Get Started', th: 'เริ่มต้น' },
  
  // Energy labels
  energyLabels: {
    en: ['Drained', 'Tired', 'Okay', 'Energized', 'On Fire'],
    th: ['หมดแรง', 'เหนื่อย', 'พอใช้', 'มีพลัง', 'เต็มเปี่ยม']
  },
  stressLabels: {
    en: ['Calm', 'Low', 'Moderate', 'High', 'Overwhelmed'],
    th: ['สงบ', 'น้อย', 'ปานกลาง', 'สูง', 'ท่วมท้น']
  },
  socialLabels: {
    en: ['Alone time', 'Quiet', 'Neutral', 'Chatty', 'Social butterfly'],
    th: ['อยู่คนเดียว', 'เงียบๆ', 'ปกติ', 'อยากคุย', 'สังคม']
  },
  sleepLabels: {
    en: ['Terrible', 'Poor', 'Fair', 'Good', 'Amazing'],
    th: ['แย่มาก', 'ไม่ดี', 'พอใช้', 'ดี', 'ยอดเยี่ยม']
  },
  focusLabels: {
    en: ['Drifting', 'Scattered', 'Okay', 'Focused', 'Sharp'],
    th: ['ล่องลอย', 'วอกแวก', 'พอไหว', 'โฟกัส', 'คมกริบ']
  },
  outlookLabels: {
    en: ['Worried', 'Unsure', 'Neutral', 'Hopeful', 'Excited'],
    th: ['กังวล', 'ไม่แน่ใจ', 'เฉยๆ', 'มีหวัง', 'ตื่นเต้น']
  },
  
  // Results
  yourRecommendations: { en: 'Your Recommendations', th: 'คำแนะนำสำหรับคุณ' },
  activity: { en: 'Activity', th: 'กิจกรรม' },
  playlist: { en: 'Playlist', th: 'เพลย์ลิสต์' },
  foodDrink: { en: 'Food & Drink', th: 'อาหารและเครื่องดื่ม' },
  message: { en: 'Message', th: 'ข้อความ' },
  journalPrompt: { en: 'Tell us how you feel now, after reading 🥺', th: 'บอกความรู้สึกของคุณตอนนี้หลังอ่านสิ 🥺' },
  afternoonReminder: { en: "Haven't fueled your streak today — how about a quick mood check-in?", th: 'ยังไม่ได้เติมไฟวันนี้เลย ลองเช็กอารมณ์กันหน่อยไหม 🔥' },
  saveJournal: { en: 'Save', th: 'บันทึก' },
  saved: { en: 'Saved!', th: 'บันทึกแล้ว!' },
  loading: { en: 'Generating your personalized recommendations...', th: 'กำลังสร้างคำแนะนำสำหรับคุณ...' },
  showingDefaultRecommendations: { en: 'Showing standard suggestions', th: 'แสดงคำแนะนำมาตรฐาน' },
  
  // History
  weeklyTrend: { en: 'Mood Trend', th: 'แนวโน้มอารมณ์' },
  moodBefore: { en: 'Before reading', th: 'ก่อนอ่าน' },
  moodAfter: { en: 'After reading', th: 'หลังอ่าน' },
  rangeWeek: { en: 'This Week', th: 'สัปดาห์นี้' },
  rangeMonth: { en: 'Month', th: 'เดือน' },
  rangeCustom: { en: 'Custom', th: 'กำหนดเอง' },
  monthlyOverview: { en: 'Monthly Overview', th: 'ภาพรวมรายเดือน' },
  moodBreakdown: { en: 'Mood Breakdown', th: 'การวิเคราะห์อารมณ์' },
  exportCSV: { en: 'Export CSV', th: 'ดาวน์โหลด CSV' },
  noData: { en: 'No check-ins yet. Start your first one!', th: 'ยังไม่มีเช็คอิน เริ่มเช็คอินครั้งแรก!' },
  
  // Wellness tip
  wellnessTip: { en: 'Wellness Tip', th: 'เคล็ดลับสุขภาพ' },
  wellnessTipMsg: { en: "We noticed you've been feeling low recently. Remember, it's okay to have tough days. Consider talking to someone you trust or trying a short mindfulness exercise.", th: 'เราสังเกตว่าคุณรู้สึกไม่ค่อยดีช่วงนี้ อย่าลืมว่าการมีวันที่ยากลำบากเป็นเรื่องปกติ ลองพูดคุยกับคนที่คุณไว้ใจ หรือลองทำสมาธิสั้นๆ ดูนะ' },
  
  // Share
  share: { en: 'Share', th: 'แชร์' },
  download: { en: 'Save Image', th: 'บันทึกรูป' },
  close: { en: 'Close', th: 'ปิด' },
  shareMoodCard: { en: 'Share Mood Card', th: 'แชร์การ์ดอารมณ์' },
  
  // Quick check-in
  quickCheckin: { en: 'Quick Check-in', th: 'เช็คอินด่วน' },
  
  // History search/export
  searchJournal: { en: 'Search journal entries...', th: 'ค้นหาบันทึก...' },
  moodRange: { en: 'Mood', th: 'อารมณ์' },
  clear: { en: 'Clear', th: 'ล้าง' },
  days: { en: 'days', th: 'วัน' },
  
  // AI re-render
  regenerating: { en: 'Refreshing recommendations...', th: 'กำลังอัปเดตคำแนะนำ...' },
  
  // Days
  mon: { en: 'Mon', th: 'จ.' },
  tue: { en: 'Tue', th: 'อ.' },
  wed: { en: 'Wed', th: 'พ.' },
  thu: { en: 'Thu', th: 'พฤ.' },
  fri: { en: 'Fri', th: 'ศ.' },
  sat: { en: 'Sat', th: 'ส.' },
  sun: { en: 'Sun', th: 'อา.' },

  // ==========================================
  // ADMIN PANEL TRANSLATIONS
  // ==========================================
  adminExecutiveReport: { en: 'Executive Report', th: 'รายงานสรุปผู้บริหาร' },
  adminSubtitle: { en: 'Summary of user moods, mental wellness, and energy metrics', th: 'สรุปข้อมูลการเช็คอินอารมณ์ สุขภาพจิต และระดับพลังงาน' },
  tabUsers: { en: 'Users', th: 'ผู้ใช้งาน' },
  tabDataAnalytics: { en: 'Data & Analytics', th: 'ข้อมูลและการวิเคราะห์' },
  tabAISettings: { en: 'AI Settings', th: 'ตั้งค่า AI' },
  viewGraph: { en: 'Graph View', th: 'สรุปแบบกราฟ' },
  viewTable: { en: 'Table View', th: 'สรุปแบบตาราง' },
  viewUserList: { en: 'User Directory', th: 'รายชื่อผู้ใช้' },

  // Admin KPI Cards
  statTotalUsers: { en: 'Total Users', th: 'จำนวนผู้ใช้งานทั้งหมด' },
  statTotalRecords: { en: 'Total Records', th: 'บันทึกทั้งหมดสะสม' },
  statCurrentUser: { en: 'Viewing User Data', th: 'ผู้ใช้งานที่กำลังดูข้อมูล' },
  statShowingRecords: { en: 'Currently Showing', th: 'รายการที่แสดงขณะนี้' },
  allUsers: { en: 'All Users', th: 'ทุกคน (All Users)' },
  allTime: { en: 'All Time', th: 'ทั้งหมด' },
  weekly: { en: 'Weekly', th: 'รายสัปดาห์' },
  monthly: { en: 'Monthly', th: 'รายเดือน' },
  filterUser: { en: 'User:', th: 'ผู้ใช้:' },
  filterTimeScope: { en: 'Timeframe:', th: 'ช่วงเวลา:' },
  resetFilters: { en: 'Reset Filters', th: 'รีเซ็ตตัวกรอง' },

  // Admin Metric Cards
  kpiAvgMood: { en: 'Average Mood', th: 'อารมณ์เฉลี่ย' },
  kpiAvgStress: { en: 'Average Stress', th: 'ความเครียดเฉลี่ย' },
  kpiAvgEnergy: { en: 'Average Energy', th: 'พลังงานเฉลี่ย' },
  kpiAvgSleep: { en: 'Average Sleep', th: 'การนอนหลับเฉลี่ย' },
  kpiAvgSocial: { en: 'Average Social', th: 'สังคมเฉลี่ย' },

  // Data Actions
  importCSV: { en: 'Import CSV', th: 'นำเข้า CSV' },
  exportCSVBtn: { en: 'Export CSV', th: 'ส่งออก CSV' },
  addNewRecord: { en: 'Add Record', th: 'เพิ่มข้อมูลใหม่' },
  editRecord: { en: 'Edit Record', th: 'แก้ไขข้อมูล' },
  deleteRecord: { en: 'Delete Record', th: 'ลบข้อมูล' },
  deleteConfirm: { en: 'Are you sure you want to delete this record?', th: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?' },
  searchPlaceholder: { en: 'Search records or user email...', th: 'ค้นหารายการ หรือ อีเมลผู้ใช้...' },
  actions: { en: 'Actions', th: 'จัดการ' },
  date: { en: 'Date', th: 'วันที่' },
  userCol: { en: 'User', th: 'ผู้ใช้' },
  timeOfDayCol: { en: 'Time of Day', th: 'ช่วงเวลา' },
  note: { en: 'Note', th: 'ข้อความบันทึก' },
  recommendation: { en: 'AI Recommendation', th: 'คำแนะนำ AI' },
  saveChanges: { en: 'Save Changes', th: 'บันทึกการเปลี่ยนแปลง' },
  cancel: { en: 'Cancel', th: 'ยกเลิก' },

  // AI Settings Tab
  geminiApiKeyLabel: { en: 'Google Gemini API Key', th: 'Google Gemini API Key' },
  geminiApiKeyPlaceholder: { en: 'AIzaSy...', th: 'AIzaSy...' },
  geminiModelLabel: { en: 'AI Model', th: 'โมเดล AI' },
  testConnection: { en: 'Test Connection', th: 'ทดสอบการเชื่อมต่อ' },
  saveSettings: { en: 'Save Settings', th: 'บันทึกการตั้งค่า' },
  connectionSuccess: { en: 'Gemini API connection successful!', th: 'เชื่อมต่อกับ Gemini API สำเร็จ!' },
  connectionFailed: { en: 'Gemini API connection failed', th: 'เชื่อมต่อกับ Gemini API ไม่สำเร็จ' },
  settingsSaved: { en: 'Settings saved successfully', th: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' },
  aiSettingsDesc: { en: 'Configure your Google Gemini API key to power AI wellness recommendations. The key is securely stored in Supabase with RLS.', th: 'ตั้งค่า Google Gemini API Key เพื่อเปิดใช้งานระบบคำแนะนำ AI ข้อมูลจะถูกเก็บอย่างปลอดภัยใน Supabase' },
  realtimeActive: { en: 'Realtime Sync Active', th: 'ระบบซิงก์ข้อมูลเรียลไทม์ทำงานอยู่' },

  // Notifications (Client-side scheduling)
  notificationsTitle: { en: 'Daily Check-in Reminders', th: 'การแจ้งเตือนเตือนเติมไฟประจำวัน' },
  notificationsDesc: { en: 'Client-side reminders scheduled on your device. Free and reliable.', th: 'ตั้งเตือนอัตโนมัติบนอุปกรณ์ของคุณ ทำงานฟรี 100% ไม่ต้องเสียค่าบริการคลาวด์' },
  reminderTimes: { en: 'Reminder Times', th: 'รอบเวลาแจ้งเตือน' },
  addReminderTime: { en: 'Add Reminder Time', th: 'เพิ่มเวลาแจ้งเตือน' },
  removeReminderTime: { en: 'Remove', th: 'ลบ' },
  detectedTimezone: { en: 'Detected Timezone', th: 'เขตเวลาที่ตรวจพบ' },
  saveNotificationSettings: { en: 'Save Reminder Times', th: 'บันทึกเวลาแจ้งเตือน' },
  notificationSettingsSaved: { en: 'Reminder times saved & scheduled!', th: 'บันทึกและตั้งเวลาแจ้งเตือนสำเร็จ!' },
  testNotification: { en: 'Send Test Notification', th: 'ทดสอบส่งการแจ้งเตือน' },
  notificationPromptTitle: { en: 'Vibe Check Time! 🔥', th: 'ได้เวลาเติมไฟแล้ว! 🔥' },
  notificationPromptBody: { en: 'Take 60 seconds to check in on your mood today.', th: 'ใช้เวลาเพียง 60 วินาทีมาเช็คอินและบันทึกอารมณ์ของคุณกันเถอะ' },

  // Multi Check-in & Streak
  checkinAgain: { en: 'Check In Again', th: 'เช็คอินอีกครั้ง' },
  viewLatestResults: { en: 'View Latest Results', th: 'ดูผลลัพธ์ล่าสุด' },
  todayCheckinCount: { en: 'check-in(s) today', th: 'ครั้งวันนี้' },
  streakNotFueled: { en: "Haven't fueled today", th: 'ยังไม่ได้เติมไฟวันนี้' },
  streakFueled: { en: 'Streak fueled today!', th: 'เติมไฟวันนี้แล้ว!' },
  streakInactivePrompt: { en: 'Check in today to keep your fire streak alive! 🩶', th: 'เช็คอินวันนี้เพื่อจุดไฟต่อเนื่องของคุณ! 🩶' },

  // Daily Timeline Chart
  dailyTimelineTitle: { en: 'Daily Mood Timeline', th: 'กราฟไทม์ไลน์อารมณ์รายวัน' },
  dailyTimelineSubtitle: { en: 'Track how your mood shifts throughout the day', th: 'ดูการเปลี่ยนแปลงของอารมณ์ในแต่ละช่วงเวลาของวัน' },
  selectDate: { en: 'Date', th: 'วันที่' },
  today: { en: 'Today', th: 'วันนี้' },
  yesterday: { en: 'Yesterday', th: 'เมื่อวาน' },
  noCheckinsOnDate: { en: 'No check-ins recorded for this day', th: 'ไม่มีการเช็คอินในวันที่เลือก' },
  moodScore: { en: 'Mood Score', th: 'คะแนนอารมณ์' },
  checkinAt: { en: 'Check-in at', th: 'เช็คอินเวลา' },
  timeOfDay: { en: 'Time of Day', th: 'ช่วงเวลา' },
  hourOfDay: { en: 'Hour of Day', th: 'ชั่วโมงในวัน' },

  // Admin Daily Charts
  adminDailyChartTitle: { en: 'Daily Check-in Timeline Analysis', th: 'การวิเคราะห์ไทม์ไลน์เช็คอินรายวัน' },
  viewIndividual: { en: 'Individual User', th: 'ไทม์ไลน์รายบุคคล' },
  viewAggregate: { en: 'All Users (Aggregate)', th: 'ภาพรวมทุกคน (Aggregate)' },
  hourlyAverageMood: { en: 'Average Mood by Hour', th: 'ค่าเฉลี่ยอารมณ์ตามชั่วโมง' },
  totalCheckinsToday: { en: 'Total Daily Check-ins', th: 'ยอดเช็คอินรวมวันนี้' },
  activeUsersToday: { en: 'Active Users Today', th: 'ผู้ใช้งานที่เช็คอินวันนี้' },
  averageDailyMood: { en: 'Average Mood Today', th: 'คะแนนอารมณ์เฉลี่ยวันนี้' },
  checkinCount: { en: 'Check-in Count', th: 'จำนวนครั้งที่เช็คอิน' },
  tabDailyTimeline: { en: 'Daily Timeline', th: 'ไทม์ไลน์รายวัน' },

  // General & Missing
  time: { en: 'Time', th: 'เวลา' },
  reminderBanner: { en: "You haven't checked in today. Take a minute to log your mood!", th: 'วันนี้คุณยังไม่ได้เช็คอินอารมณ์เลย แวะมาบันทึกความรู้สึกกันเถอะ!' },
  pleaseAnswerAll: { en: 'Please answer all required questions before submitting.', th: 'กรุณาตอบคำถามที่จำเป็นให้ครบถ้วนก่อนส่ง' },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // 1. Check localStorage
    const saved = localStorage.getItem('vibecheck_lang');
    if (saved === 'th' || saved === 'en') return saved;
    // 2. Detect browser language
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('th')) {
      return 'th';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('vibecheck_lang', lang);
  }, [lang]);

  const t = (key) => {
    const entry = translations[key];
    if (!entry) return key;
    if (typeof entry === 'object' && !Array.isArray(entry) && entry.en) {
      return entry[lang] || entry.en;
    }
    return entry;
  };

  const tArr = (key) => {
    const entry = translations[key];
    if (!entry) return [];
    return entry[lang] || entry.en || [];
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'th' : 'en'));
  };

  const setLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'th') {
      setLang(newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, setLanguage, t, tArr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLang must be used within a LanguageProvider');
  }
  return context;
};