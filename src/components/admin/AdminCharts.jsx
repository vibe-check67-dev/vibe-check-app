import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useLang } from '@/context/LanguageContext';

export default function AdminCharts({ checkins = [] }) {
  const { t, lang } = useLang();

  // 1. Prepare timeline data (sorted chronologically)
  const timelineMap = {};
  [...checkins]
    .sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date))
    .forEach((item) => {
      const d = item.checkin_date;
      if (!timelineMap[d]) {
        timelineMap[d] = {
          date: d,
          moodSum: 0,
          stressSum: 0,
          energySum: 0,
          sleepSum: 0,
          count: 0,
        };
      }
      timelineMap[d].moodSum += Number(item.overall_mood || 0);
      timelineMap[d].stressSum += Number(item.stress || 0);
      timelineMap[d].energySum += Number(item.energy || 0);
      timelineMap[d].sleepSum += Number(item.sleep || 0);
      timelineMap[d].count += 1;
    });

  const timelineData = Object.values(timelineMap).map((item) => ({
    date: item.date.slice(5), // MM-DD
    fullDate: item.date,
    mood: +(item.moodSum / item.count).toFixed(1),
    stress: +(item.stressSum / item.count).toFixed(1),
    energy: +(item.energySum / item.count).toFixed(1),
    sleep: +(item.sleepSum / item.count).toFixed(1),
    count: item.count,
  }));

  // 2. Prepare 5-dimension radar well-being data (Well-being Radar)
  const count = checkins.length || 1;
  const totals = checkins.reduce(
    (acc, curr) => ({
      mood: acc.mood + Number(curr.overall_mood || 0),
      stress: acc.stress + Number(curr.stress || 0),
      energy: acc.energy + Number(curr.energy || 0),
      sleep: acc.sleep + Number(curr.sleep || 0),
      social: acc.social + Number(curr.social || 0),
    }),
    { mood: 0, stress: 0, energy: 0, sleep: 0, social: 0 }
  );

  const radarData = [
    {
      subject: lang === 'th' ? 'อารมณ์ 😊' : 'Mood 😊',
      score: checkins.length ? +(totals.mood / count).toFixed(1) : 0,
      fullMark: 5,
    },
    {
      subject: lang === 'th' ? 'ความเครียด 🔥' : 'Stress 🔥',
      score: checkins.length ? +(totals.stress / count).toFixed(1) : 0,
      fullMark: 5,
    },
    {
      subject: lang === 'th' ? 'พลังงาน ⚡' : 'Energy ⚡',
      score: checkins.length ? +(totals.energy / count).toFixed(1) : 0,
      fullMark: 5,
    },
    {
      subject: lang === 'th' ? 'การนอน 🌙' : 'Sleep 🌙',
      score: checkins.length ? +(totals.sleep / count).toFixed(1) : 0,
      fullMark: 5,
    },
    {
      subject: lang === 'th' ? 'สังคม 💭' : 'Social 💭',
      score: checkins.length ? +(totals.social / count).toFixed(1) : 0,
      fullMark: 5,
    },
  ];

  // 3. Time of day distribution
  const timeOfDayMap = { morning: 0, afternoon: 0, evening: 0 };
  checkins.forEach((item) => {
    const tod = item.time_of_day || 'morning';
    if (timeOfDayMap[tod] !== undefined) {
      timeOfDayMap[tod] += 1;
    }
  });

  const timeOfDayData = [
    { name: lang === 'th' ? 'เช้า (Morning)' : 'Morning', value: timeOfDayMap.morning, color: '#f59e0b' },
    { name: lang === 'th' ? 'บ่าย (Afternoon)' : 'Afternoon', value: timeOfDayMap.afternoon, color: '#0ea5e9' },
    { name: lang === 'th' ? 'เย็น/ค่ำ (Evening)' : 'Evening', value: timeOfDayMap.evening, color: '#6366f1' },
  ];

  if (checkins.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 border text-center text-muted-foreground text-sm">
        {t('noData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Timeline Chart Card */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              📈 {lang === 'th' ? 'แนวโน้มคะแนนเฉลี่ยตามช่วงเวลา' : 'Average Metric Trends Over Time'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'th'
                ? 'เปรียบเทียบระดับอารมณ์, ความเครียด, พลังงาน และการนอนหลับ'
                : 'Comparative trend of mood, stress, energy, and sleep'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {checkins.length} {lang === 'th' ? 'บันทึก' : 'records'}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="mood"
                name={t('kpiAvgMood')}
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="stress"
                name={t('kpiAvgStress')}
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                name={t('kpiAvgEnergy')}
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="sleep"
                name={t('kpiAvgSleep')}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Side-by-side distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Balance Chart: Well-being Radar (Replaces BarChart) */}
        <div className="bg-card rounded-2xl p-5 border shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>🎯</span>
              <span>{lang === 'th' ? 'ภาพรวมสมดุลชีวิต (Well-being Radar)' : 'Life Balance (Well-being Radar)'}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'th'
                ? 'คะแนนเฉลี่ยทั้ง 5 ด้านของผู้ใช้/ช่วงเวลาที่เลือก'
                : 'Average scores across 5 dimensions for the selected filter'}
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" opacity={0.6} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} / 5`, lang === 'th' ? 'คะแนนเฉลี่ย' : 'Average Score']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Radar
                  name={lang === 'th' ? 'คะแนนเฉลี่ย' : 'Average'}
                  dataKey="score"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="#38bdf8"
                  fillOpacity={0.25}
                  dot={{ r: 4, fill: '#0284c7', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day Pie Chart */}
        <div className="bg-card rounded-2xl p-5 border shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              ⏰ {lang === 'th' ? 'สัดส่วนช่วงเวลาการเช็คอิน' : 'Check-ins by Time of Day'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'th' ? 'ช่วงเวลาที่ผู้ใช้งานมีกิจกรรมเช็คอินมากที่สุด' : 'When users most frequently log their mood'}
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeOfDayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {timeOfDayData.map((entry, idx) => (
                    <Cell key={`pie-cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
