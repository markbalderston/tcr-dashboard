import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import * as Papa from 'papaparse';

// ═══════════════════════════════════════════════════════════════════════════════
// THE CLOUD REPORT DASHBOARD v8
// Live CSV data • Deduplication • Cancellation tracking • Fulfillment checklist
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  blue: '#0078BF', pink: '#F15060', green: '#00A95C', orange: '#FF6C2F',
  purple: '#765BA7', teal: '#00838A', red: '#E02B35', cream: '#FAF3E8',
  black: '#1a1a1a', gray: '#666', lightGray: '#e8e8e8', white: '#ffffff'
};

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK GUEST LIST (used if Google Sheet guest tab fetch fails)
// ═══════════════════════════════════════════════════════════════════════════════
const FALLBACK_GUEST_LIST = [
  { id: 1, name: 'Jon Adams-Kollitz', address: '991 Pine St', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 2, name: 'Tabitha Tice', address: '695 W 11th Ave., Apt. 3', city: 'Eugene', state: 'OR', zip: '97402' },
  { id: 3, name: 'Jacob Mushlin & MC McGovern', address: '157 Chapman Ln', city: 'Williston', state: 'VT', zip: '05495' },
  { id: 4, name: 'David Hill', address: '31 Brooksbie Rd.', city: 'Bedford', state: 'MA', zip: '01730' },
  { id: 5, name: 'Jane Henderson & Annalise Carrington', address: '39 Blodgett St', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 6, name: 'Grace Oedel & Jacob Holzberg-Pill', address: '30 Gazo Ave.', city: 'Burlington', state: 'VT', zip: '05408' },
  { id: 7, name: 'Andrea Solazzo & Patrick Dunseith', address: '33 Holly Lane', city: 'Burlington', state: 'VT', zip: '05408' },
  { id: 8, name: 'Liza & Tyler Cannon & Sophia Howatt', address: '115 Green Acres Drive', city: 'Burlington', state: 'VT', zip: '05408' },
  { id: 9, name: 'Sophie Cassel', address: '73 High Meadow Lane', city: 'Richmond', state: 'VT', zip: '05477', note: 'Also a paid subscriber' },
  { id: 10, name: 'Sarah & Jenny Caban', address: '106 Wetherbee Rd', city: 'Waltham', state: 'MA', zip: '02453' },
  { id: 11, name: 'Chapin Spencer', address: '645 Pine St # A', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 12, name: 'Allison Cassity', address: '115 Isaac Lane', city: 'Hazel Green', state: 'GA', zip: '35750' },
  { id: 13, name: 'Ainsley Judge & Adrian O\'Barr', address: '65 Lexington Ave', city: 'Portland', state: 'ME', zip: '04103' },
  { id: 14, name: 'Zoe Richards', address: '15 Catherine St.', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 15, name: 'Lauren Mazel', address: '10836 Douglas Ave', city: 'Silver Spring', state: 'MD', zip: '20902' },
  { id: 16, name: 'Eliza Rosenberry', address: '2326 Hoard St', city: 'Madison', state: 'WI', zip: '53704' },
  { id: 17, name: 'Meghan Oretsky', address: '1773 College View Pl.', city: 'Los Angeles', state: 'CA', zip: '90041' },
  { id: 18, name: 'Cayla Tepper', address: '3952 W Waveland Ave #3', city: 'Chicago', state: 'IL', zip: '60618' },
  { id: 19, name: 'Isabella Thorndike', address: '369 Granite St', city: 'Ashland', state: 'OR', zip: '97520' },
  { id: 20, name: 'Cheryl Pespisa', address: '3 Washington St.', city: 'Bedford', state: 'MA', zip: '01730' },
  { id: 21, name: 'Alexandra Rose & Myles Jewell', address: '44 Saratoga Ave', city: 'Burlington', state: 'VT', zip: '05408' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER SHEET CONNECTION
// Sheet: "TCR Operations - Master"
// ID: 1nJaA78lQ2JnbLdVpRalnTFHEj3yMjDlYH6-f-5uP5OE
// ═══════════════════════════════════════════════════════════════════════════════
const SHEET_ID = '1nJaA78lQ2JnbLdVpRalnTFHEj3yMjDlYH6-f-5uP5OE';
const SUBSCRIBERS_GID = '1234159284';
const GUEST_LIST_GID = '0'; // Default first tab — update if guest list is on a different tab

const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${SUBSCRIBERS_GID}`;

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING — Annual changed from 20% off ($76.80/yr) to 15% off ($81.60/yr) on ~Jan 20
// ═══════════════════════════════════════════════════════════════════════════════
const MONTHLY_PRICE = 8.00;
const ANNUAL_OLD_YEARLY = 76.80;  // Before Jan 20, 2026: 20% off → $6.40/mo
const ANNUAL_NEW_YEARLY = 81.60;  // Jan 20, 2026+:  15% off → $6.80/mo
const PRICE_CHANGE_DATE = '2026-01-20';

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK DATA — Used when fetch fails (e.g. Claude preview sandbox)
// Source: verified January 2026 numbers from v5 dashboard
// Note: All fallback subscribers are pre-Jan-20 so use old annual rate ($6.40/mo)
// ═══════════════════════════════════════════════════════════════════════════════
const FALLBACK_STATS = {
  totalRawRows: 1038,
  total: 1033,
  monthly: 657,
  annual: 385,
  annualOldRate: 385,
  annualNewRate: 0,
  mrr: (657 * MONTHLY_PRICE) + (385 * (ANNUAL_OLD_YEARLY / 12)),
  arr: ((657 * MONTHLY_PRICE) + (385 * (ANNUAL_OLD_YEARLY / 12))) * 12,
  cancelled: 5,
  cancelledMonthly: 1,
  cancelledAnnual: 4,
  churnRate: (5 / 1038) * 100,
  avgDaysToCancel: 1.8,
  countries: {
    'United States': 870, 'Canada': 65, 'United Kingdom': 49, 'Australia': 15,
    'France': 10, 'Germany': 8, 'Singapore': 4, 'Austria': 3, 'Ireland': 3,
    'New Zealand': 3, 'Norway': 3, 'Iceland': 2, 'Italy': 2, 'Mexico': 2,
    'Netherlands': 2, 'Philippines': 2, 'Poland': 2, 'Portugal': 2, 'Sweden': 2,
    'Belgium': 1, 'Croatia': 1, 'Denmark': 1, 'Hungary': 1, 'Pakistan': 1
  },
  usStates: {
    'California': 115, 'New York': 98, 'Vermont': 72, 'Massachusetts': 58,
    'Texas': 45, 'Colorado': 38, 'Washington': 35, 'Illinois': 32,
    'Oregon': 28, 'Pennsylvania': 27, 'Florida': 26, 'Virginia': 24
  },
  byDate: {
    '2026-01-06': 12, '2026-01-07': 18, '2026-01-08': 45, '2026-01-09': 559,
    '2026-01-10': 240, '2026-01-11': 89, '2026-01-12': 42, '2026-01-13': 28
  },
  intlCount: 184,
  usCount: 870,
  countryCount: 24,
  stateCount: 48,
  problems: 0,
  problemList: [],
  cancelledList: [
    { order_id: '02847', name: 'Emily Chen', email: 'e.chen@email.com', subscription_type: 'Annual', subscription_date: '2026-01-09', created_at: '2026-01-09', cancelled_at: '2026-01-09' },
    { order_id: '02891', name: 'Marcus Johnson', email: 'm.johnson@email.com', subscription_type: 'Annual', subscription_date: '2026-01-09', created_at: '2026-01-09', cancelled_at: '2026-01-10' },
    { order_id: '02756', name: 'Sarah Williams', email: 's.williams@email.com', subscription_type: 'Annual', subscription_date: '2026-01-08', created_at: '2026-01-08', cancelled_at: '2026-01-08' },
    { order_id: '02912', name: 'David Park', email: 'd.park@email.com', subscription_type: 'Annual', subscription_date: '2026-01-10', created_at: '2026-01-10', cancelled_at: '2026-01-10' },
    { order_id: '02634', name: 'Jessica Miller', email: 'j.miller@email.com', subscription_type: 'Monthly', subscription_date: '2026-01-06', created_at: '2026-01-06', cancelled_at: '2026-01-13' }
  ],
  sheetFlaggedDupes: 0,
  duplicatesRemoved: 0,
  duplicateList: [],
  guestListCount: FALLBACK_GUEST_LIST.length,
  totalMailingList: 1033 + FALLBACK_GUEST_LIST.length - 1,
  lastUpdated: null,
  isFallback: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

function toTitleCase(str) {
  if (!str) return str;
  if (str === str.toUpperCase() && str.length > 2) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return str;
}

// Extract the actual subscription date (not the Zapier-added-to-sheet date)
// Prefers subscription_date column; falls back to created_at
function getSubDate(row) {
  const sd = row.subscription_date || '';
  if (sd) return sd.split(' ')[0].split('T')[0];
  const ca = row.created_at || '';
  if (ca) return ca.split(' ')[0].split('T')[0];
  return '';
}

function processCSV(csvText, guestCount = FALLBACK_GUEST_LIST.length) {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error('Could not parse CSV: ' + result.errors[0].message);
  }

  // Clean rows — normalize plan column → subscription_type
  // Sheet column is "plan" with values like "Monthly", "The Cloud Report - Monthly",
  // "The Cloud Report - Annual", or multi-product combos containing those.
  const normalizePlan = (row) => {
    const raw = (row.plan || row.subscription_type || '').toLowerCase();
    if (raw.includes('annual')) return 'Annual';
    if (raw.includes('monthly')) return 'Monthly';
    return 'Other';
  };

  const allRows = result.data
    .filter(row => row.order_id && row.name)
    .map(row => ({
      ...row,
      subscription_type: normalizePlan(row),
      city: toTitleCase(row.city),
      address1: toTitleCase(row.address1),
      address2: toTitleCase(row.address2),
      _email_key: (row.email || '').trim().toLowerCase()
    }));

  // ─── Filter out sheet-flagged duplicates (duplicate_flag column) ───
  // Mark flags these manually via the Google Apps Script; dashboard respects them
  const sheetFlaggedDupes = allRows.filter(r => r.duplicate_flag && r.duplicate_flag.trim());
  const cleanRows = allRows.filter(r => !r.duplicate_flag || !r.duplicate_flag.trim());

  // ─── Separate cancelled vs active ───
  const cancelled = cleanRows.filter(r => r.status === 'cancelled' || r.cancelled_at);
  const activeRaw = cleanRows.filter(r => r.status !== 'cancelled' && !r.cancelled_at);

  // ─── DEDUPLICATION ───
  // Group active rows by email. For each email with multiple entries,
  // keep the one with the highest order_id (most recent order).
  // The "extra" rows are renewals pulled in by Zapier.
  const emailGroups = {};
  activeRaw.forEach(r => {
    const key = r._email_key || r.order_id; // fallback if no email
    if (!emailGroups[key]) emailGroups[key] = [];
    emailGroups[key].push(r);
  });

  const active = [];
  const duplicates = [];
  Object.values(emailGroups).forEach(group => {
    if (group.length === 1) {
      active.push(group[0]);
    } else {
      // Sort by order_id descending (highest = newest)
      group.sort((a, b) => (b.order_id || '').localeCompare(a.order_id || ''));
      active.push(group[0]); // keep newest
      group.slice(1).forEach(dup => {
        duplicates.push({ ...dup, _kept_order: group[0].order_id });
      });
    }
  });

  // ─── Counts ───
  const monthly = active.filter(r => r.subscription_type === 'Monthly').length;
  const annual = active.filter(r => r.subscription_type === 'Annual').length;

  // ─── MRR with tiered annual pricing ───
  // Annual changed from $76.80/yr (20% off) to $81.60/yr (15% off) on ~Jan 20, 2026
  let mrr = 0;
  let annualOldRate = 0;
  let annualNewRate = 0;
  active.forEach(r => {
    if (r.subscription_type === 'Monthly') {
      mrr += MONTHLY_PRICE;
    } else if (r.subscription_type === 'Annual') {
      const subDate = getSubDate(r);
      if (subDate >= PRICE_CHANGE_DATE) {
        mrr += ANNUAL_NEW_YEARLY / 12;
        annualNewRate++;
      } else {
        mrr += ANNUAL_OLD_YEARLY / 12;
        annualOldRate++;
      }
    }
  });

  // ─── Geography ───
  const countries = {};
  active.forEach(r => { const c = r.country || 'Unknown'; countries[c] = (countries[c] || 0) + 1; });
  const usStates = {};
  active.filter(r => r.country === 'United States').forEach(r => { const s = r.state || 'Unknown'; usStates[s] = (usStates[s] || 0) + 1; });
  const intlCount = active.filter(r => r.country && r.country !== 'United States').length;

  // ─── Timeline (uses subscription_date, not the Zapier-added-to-sheet date) ───
  const byDate = {};
  active.forEach(r => {
    const date = getSubDate(r);
    if (date) {
      byDate[date] = (byDate[date] || 0) + 1;
    }
  });

  // ─── Address issues ───
  const problems = active.filter(r => {
    if (!r.zip || r.zip.trim().length < 2) return true;
    if (!r.address1 || r.address1.trim().length < 3) return true;
    if (!r.city || r.city.trim().length < 2) return true;
    if (r.address1 && r.address1.length > 60) return true;
    return false;
  }).map(r => {
    const issues = [];
    if (!r.zip || r.zip.trim().length < 2) issues.push('Missing zip/postal code');
    if (!r.address1 || r.address1.trim().length < 3) issues.push('Missing address');
    if (!r.city || r.city.trim().length < 2) issues.push('Missing city');
    if (r.address1 && r.address1.length > 60) issues.push('Very long address');
    return { ...r, issues };
  });

  // ─── Cancellation details ───
  const cancelledMonthly = cancelled.filter(r => r.subscription_type === 'Monthly').length;
  const cancelledAnnual = cancelled.filter(r => r.subscription_type === 'Annual').length;

  // Compute avg days to cancel (subscription_date → cancelled_at)
  let totalDays = 0;
  let countWithDates = 0;
  cancelled.forEach(r => {
    const subDate = getSubDate(r);
    if (subDate && r.cancelled_at) {
      const created = new Date(subDate);
      const cancelledDate = new Date(r.cancelled_at);
      if (!isNaN(created) && !isNaN(cancelledDate)) {
        totalDays += Math.max(0, (cancelledDate - created) / (1000 * 60 * 60 * 24));
        countWithDates++;
      }
    }
  });
  const avgDaysToCancel = countWithDates > 0 ? (totalDays / countWithDates) : 0;

  return {
    stats: {
      totalRawRows: allRows.length,
      total: active.length,
      monthly,
      annual,
      annualOldRate,
      annualNewRate,
      mrr,
      arr: mrr * 12,
      cancelled: cancelled.length,
      cancelledMonthly,
      cancelledAnnual,
      churnRate: (active.length + cancelled.length) > 0 ? ((cancelled.length / (active.length + cancelled.length)) * 100) : 0,
      avgDaysToCancel,
      countries,
      usStates,
      byDate,
      intlCount,
      usCount: active.length - intlCount,
      countryCount: Object.keys(countries).length,
      stateCount: Object.keys(usStates).length,
      problems: problems.length,
      problemList: problems,
      cancelledList: cancelled,
      sheetFlaggedDupes: sheetFlaggedDupes.length,
      duplicatesRemoved: duplicates.length,
      duplicateList: duplicates,
      guestListCount: guestCount,
      totalMailingList: active.length + guestCount - 1, // Sophie Cassel overlap
      lastUpdated: new Date().toISOString()
    },
    subscribers: active
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

// CSV URLs — gviz format works for publicly shared sheets (no "publish to web" needed)
const SUBSCRIBERS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SUBSCRIBERS_GID}`;
const GUEST_LIST_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GUEST_LIST_GID}`;

// Process guest list CSV from sheet
function processGuestCSV(csvText) {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (!result.data || result.data.length === 0) return null;
  
  // Flexible column matching — handles variations in column names
  return result.data
    .filter(row => {
      // Need at least a name
      const name = row.name || row.Name || row.recipient || row.Recipient || '';
      return name.trim().length > 0;
    })
    .map((row, i) => ({
      id: i + 1,
      name: (row.name || row.Name || row.recipient || row.Recipient || '').trim(),
      address: (row.address1 || row.address || row.Address || row.street || '').trim(),
      address2: (row.address2 || row.Address2 || row.apt || '').trim(),
      city: (row.city || row.City || '').trim(),
      state: (row.state || row.State || '').trim(),
      zip: (row.zip || row.Zip || row.postal_code || '').trim(),
      country: (row.country || row.Country || 'United States').trim(),
      note: (row.notes || row.note || row.Notes || '').trim() || undefined
    }));
}

export default function CloudReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [guestList, setGuestList] = useState(FALLBACK_GUEST_LIST);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [checklist, setChecklist] = useState({});
  const [timelineWindow, setTimelineWindow] = useState('30');
  const [guestNotes, setGuestNotes] = useState({});

  // Fetch live data from Google Sheets (both subscribers and guest list tabs)
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      // Fetch subscribers and guest list in parallel
      const [subResponse, guestResponse] = await Promise.allSettled([
        fetch(SUBSCRIBERS_CSV_URL),
        fetch(GUEST_LIST_CSV_URL)
      ]);

      // Process guest list (try sheet first, fall back to hardcoded)
      let liveGuests = FALLBACK_GUEST_LIST;
      if (guestResponse.status === 'fulfilled' && guestResponse.value.ok) {
        const guestCSV = await guestResponse.value.text();
        const parsed = processGuestCSV(guestCSV);
        if (parsed && parsed.length > 0) {
          liveGuests = parsed;
        }
      }
      setGuestList(liveGuests);

      // Process subscribers (required — throw if fails)
      if (subResponse.status !== 'fulfilled' || !subResponse.value.ok) {
        const status = subResponse.status === 'fulfilled' ? subResponse.value.status : 'network error';
        throw new Error(`Failed to fetch subscriber sheet (${status})`);
      }
      const csvText = await subResponse.value.text();
      const result = processCSV(csvText, liveGuests.length);
      setStats(result.stats);
      setSubscribers(result.subscribers);
      try { await window.storage?.set('tcr-v8-data', JSON.stringify({ ...result, guestList: liveGuests })); } catch (e) {}
    } catch (e) {
      // Fall back to cached data if available
      try {
        const cached = await window.storage?.get('tcr-v8-data');
        if (cached?.value) {
          const data = JSON.parse(cached.value);
          setStats(data.stats);
          setSubscribers(data.subscribers);
          if (data.guestList) setGuestList(data.guestList);
          setError('Using cached data — live fetch failed: ' + e.message);
        } else {
          // No cache — use embedded fallback data
          setStats(FALLBACK_STATS);
          setSubscribers([]);
          setGuestList(FALLBACK_GUEST_LIST);
          setError('Preview mode — could not fetch Google Sheet. Check sharing settings (must be "Anyone with the link" can view). Error: ' + e.message);
        }
      } catch (e2) {
        // Even cache read failed — use fallback
        setStats(FALLBACK_STATS);
        setSubscribers([]);
        setGuestList(FALLBACK_GUEST_LIST);
        setError('Preview mode — using fallback data. Error: ' + e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount + load persisted checklist/notes
  useEffect(() => {
    fetchData();
    const loadExtras = async () => {
      try {
        const cl = await window.storage?.get('tcr-v8-checklist');
        if (cl?.value) setChecklist(JSON.parse(cl.value));
      } catch (e) {}
      try {
        const gn = await window.storage?.get('tcr-v8-guest-notes');
        if (gn?.value) setGuestNotes(JSON.parse(gn.value));
      } catch (e) {}
    };
    loadExtras();
  }, [fetchData]);

  const toggleCheck = async (key) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    try { await window.storage?.set('tcr-v8-checklist', JSON.stringify(next)); } catch (e) {}
  };

  const resetChecklist = async () => {
    setChecklist({});
    try { await window.storage?.set('tcr-v8-checklist', JSON.stringify({})); } catch (e) {}
  };

  const saveGuestNote = async (id, text) => {
    const next = { ...guestNotes, [id]: text };
    setGuestNotes(next);
    try { await window.storage?.set('tcr-v8-guest-notes', JSON.stringify(next)); } catch (e) {}
  };

  // ─── Filter logic ───
  const filteredSubs = subscribers.filter(s => {
    const term = searchTerm.toLowerCase();
    const match = !searchTerm ||
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.city && s.city.toLowerCase().includes(term)) ||
      (s.state && s.state.toLowerCase().includes(term)) ||
      (s.zip && s.zip.includes(searchTerm)) ||
      (s.order_id && s.order_id.includes(searchTerm));
    const planMatch = planFilter === 'all' || (s.subscription_type && s.subscription_type.toLowerCase() === planFilter);
    return match && planMatch;
  });

  const filteredGuests = guestList.filter(g => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return g.name.toLowerCase().includes(term) || g.city.toLowerCase().includes(term);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ═════════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: C.cream, minHeight: '100vh', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>☁️</div>
          <h1 style={{ fontSize: '28px', color: C.blue, textTransform: 'uppercase', marginBottom: '4px' }}>Cloud Report</h1>
          <div style={{ color: C.pink, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '24px' }}>Dashboard v8</div>
          <div style={{ color: C.gray, fontSize: '13px' }}>Fetching live data from Google Sheets...</div>
          <div style={{ marginTop: '16px', width: '200px', height: '4px', background: C.lightGray, borderRadius: '2px', overflow: 'hidden', margin: '16px auto 0' }}>
            <div style={{
              width: '40%', height: '100%', background: C.blue, borderRadius: '2px',
              animation: 'shimmer 1.2s ease-in-out infinite alternate'
            }} />
          </div>
          <style>{`@keyframes shimmer { from { margin-left: 0; } to { margin-left: 60%; } }`}</style>
          {error && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#FEE', border: `1px solid ${C.red}`, fontSize: '11px', color: C.red, maxWidth: '400px', margin: '20px auto 0' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ERROR SCREEN (no data at all)
  // ═════════════════════════════════════════════════════════════════════════════
  if (!stats) {
    return (
      <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: C.cream, minHeight: '100vh', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>☁️</div>
          <h1 style={{ fontSize: '28px', color: C.blue, textTransform: 'uppercase', marginBottom: '4px' }}>Cloud Report</h1>
          <div style={{ color: C.red, fontSize: '13px', marginBottom: '20px' }}>{error || 'No data available'}</div>
          <button
            onClick={() => fetchData()}
            style={{
              padding: '12px 24px', background: C.blue, color: 'white', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold'
            }}
          >
            ↻ Retry
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═════════════════════════════════════════════════════════════════════════════

  const tabs = [
    { id: 'overview', label: '☁️ Overview', color: C.blue },
    { id: 'subscribers', label: '👥 Subscribers', color: C.green, count: null },
    { id: 'guests', label: '🎁 Guests', color: C.purple },
    { id: 'geography', label: '🌍 Geography', color: C.teal },
    { id: 'timeline', label: '📈 Timeline', color: C.orange },
    { id: 'issues', label: '⚠️ Issues', color: C.orange, count: stats?.problems || 0 },
    { id: 'cancellations', label: '📉 Cancellations', color: C.red, count: stats?.cancelled || 0 },
    { id: 'duplicates', label: '🔄 Duplicates', color: C.purple, count: (stats?.sheetFlaggedDupes || 0) + (stats?.duplicatesRemoved || 0) },
    { id: 'fulfillment', label: '✅ Fulfillment', color: C.green }
  ];

  // ─── Chart data ───
  const sortedDates = stats ? Object.keys(stats.byDate).sort() : [];
  let cumulative = 0;
  const cumulativeData = sortedDates.map(d => {
    cumulative += stats.byDate[d];
    return { date: d.slice(5), total: cumulative };
  });

  // ─── Smart timeline: only days with orders, windowed, peaks guaranteed ───
  const timelineData = (() => {
    if (!stats || sortedDates.length === 0) return [];

    // Find peak day (always shown)
    let peakDate = sortedDates[0];
    sortedDates.forEach(d => {
      if (stats.byDate[d] > stats.byDate[peakDate]) peakDate = d;
    });

    // Today string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Determine cutoff date based on window
    let cutoff = null;
    if (timelineWindow !== 'all') {
      const days = parseInt(timelineWindow, 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      cutoff = cutoffDate.toISOString().split('T')[0];
    }

    // Filter: within window OR is the peak day
    const filtered = sortedDates.filter(d => {
      if (d === peakDate) return true;       // always keep peak
      if (!cutoff) return true;              // "all" mode
      return d >= cutoff;                    // within window
    });

    return filtered.map(d => ({
      date: d.slice(5),
      fullDate: d,
      orders: stats.byDate[d],
      isPeak: d === peakDate,
      isToday: d === today
    }));
  })();

  // Legacy dailyData kept for overview if needed
  const dailyData = sortedDates.map(d => ({ date: d.slice(5), orders: stats.byDate[d] }));

  const countryData = stats ? Object.entries(stats.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([country, count]) => ({ country, count })) : [];

  const stateData = stats ? Object.entries(stats.usStates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([state, count]) => ({ state, count })) : [];

  // Fulfillment checklist items
  const checklistItems = [
    { key: 'export', label: 'Confirm Google Sheet is up to date (check Zapier ran successfully)' },
    { key: 'import', label: 'Refresh dashboard data and review metrics' },
    { key: 'dedup', label: `Review duplicates tab — ${(stats?.sheetFlaggedDupes || 0) + (stats?.duplicatesRemoved || 0)} dupes excluded` },
    { key: 'pending', label: 'Export Pending Orders from Squarespace and cross-reference with subscriber list' },
    { key: 'issues', label: `Review address issues — ${stats?.problems || 0} flagged` },
    { key: 'intl', label: `Verify international addresses (${stats?.intlCount || 0} int'l subscribers)` },
    { key: 'cancelled', label: `Confirm cancelled subscribers removed — ${stats?.cancelled || 0} cancellations` },
    { key: 'guests', label: `Verify guest list is current (${guestList.length} recipients)` },
    { key: 'labels', label: 'Generate and print US labels' },
    { key: 'labels_intl', label: 'Generate and print international labels' },
    { key: 'labels_guests', label: 'Generate and print guest list labels' },
    { key: 'qa_final', label: 'Final QA: total label count = subscribers + guests − overlap' }
  ];
  const checklistDone = checklistItems.filter(i => checklist[i.key]).length;

  return (
    <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: C.cream, minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ borderBottom: `4px solid ${C.blue}`, paddingBottom: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '28px', color: C.blue, textTransform: 'uppercase', margin: 0 }}>☁️ Cloud Report</h1>
          <span style={{ fontSize: '11px', color: C.pink, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Dashboard v8</span>
          <span style={{ fontSize: '9px', color: 'white', fontWeight: 'bold', background: stats?.isFallback ? C.orange : C.green, padding: '2px 8px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {stats?.isFallback ? '◉ Preview' : '● Live'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '10px', color: C.gray, flexWrap: 'wrap' }}>
          <span>Data: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : (stats?.isFallback ? 'Sample data (Jan 2026)' : 'N/A')}</span>
          <a
            href={MASTER_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.blue, textDecoration: 'underline', fontSize: '10px', fontWeight: 'bold' }}
          >
            📋 TCR Operations — Master Sheet
          </a>
          {(stats?.duplicatesRemoved > 0 || stats?.sheetFlaggedDupes > 0) && (
            <span style={{ color: C.purple, fontWeight: 'bold' }}>
              🔄 {(stats.sheetFlaggedDupes || 0) + (stats.duplicatesRemoved || 0)} dupe{((stats.sheetFlaggedDupes || 0) + (stats.duplicatesRemoved || 0)) !== 1 ? 's' : ''} excluded
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              padding: '4px 12px', cursor: refreshing ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: '10px',
              border: `1px solid ${C.blue}`, background: refreshing ? C.lightGray : 'white',
              color: C.blue, opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '↻ Refreshing...' : '↻ Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error/cache banner */}
      {error && (
        <div style={{
          padding: '10px 16px', marginBottom: '16px', fontSize: '11px',
          background: '#FEF3CD', border: `1px solid #FFC107`, color: '#856404'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        <Metric label="Mailing List" value={stats.totalMailingList} color={C.blue} detail={`${stats.total} paid + ${guestList.length} guests`} />
        <Metric label="MRR" value={`$${stats.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color={C.green}
          detail={`${stats.monthly}×$8 + ${stats.annualOldRate || 0}×$6.40 + ${stats.annualNewRate || 0}×$6.80`}
        />
        <Metric label="Monthly / Annual" value={`${stats.monthly} / ${stats.annual}`} color={C.pink} />
        <Metric label="US / Int'l" value={`${stats.usCount} / ${stats.intlCount}`} color={C.teal} />
        <Metric
          label="Cancelled"
          value={stats.cancelled}
          color={stats.cancelled > 0 ? C.red : C.green}
          onClick={() => setActiveTab('cancellations')}
        />
        <Metric
          label="Issues"
          value={stats.problems}
          color={stats.problems > 0 ? C.orange : C.green}
          onClick={() => setActiveTab('issues')}
        />
        <Metric
          label="Dupes Excluded"
          value={(stats.sheetFlaggedDupes || 0) + (stats.duplicatesRemoved || 0)}
          color={((stats.sheetFlaggedDupes || 0) + (stats.duplicatesRemoved || 0)) > 0 ? C.purple : C.green}
          onClick={() => setActiveTab('duplicates')}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.blue}`, marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setPlanFilter('all'); }}
            style={{
              padding: '8px 12px',
              background: activeTab === tab.id ? C.blue : 'transparent',
              color: activeTab === tab.id ? 'white' : C.blue,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '10px', textTransform: 'uppercase',
              letterSpacing: '1px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: tab.color, color: 'white', borderRadius: '8px',
                padding: '1px 6px', fontSize: '9px'
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW ═══════════ */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <Card title="Cumulative Growth">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cumulativeData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke={C.green} fill={C.green} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Plan Distribution">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: `Monthly (${stats.monthly})`, value: stats.monthly },
                      { name: `Annual (${stats.annual})`, value: stats.annual }
                    ]}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    paddingAngle={5} dataKey="value"
                    label={({ name }) => name}
                  >
                    <Cell fill={C.blue} />
                    <Cell fill={C.orange} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
          {/* Fulfillment progress bar */}
          <Card title={`Fulfillment Progress — ${checklistDone}/${checklistItems.length}`} borderColor={C.green}>
            <div style={{ background: C.lightGray, borderRadius: '4px', height: '24px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                background: checklistDone === checklistItems.length ? C.green : C.blue,
                height: '100%', width: `${(checklistDone / checklistItems.length) * 100}%`,
                transition: 'width 0.3s', borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '10px', fontWeight: 'bold'
              }}>
                {checklistDone > 0 && `${Math.round((checklistDone / checklistItems.length) * 100)}%`}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('fulfillment')}
              style={{ padding: '6px 12px', border: `1px solid ${C.green}`, background: 'white', color: C.green, cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 'bold' }}
            >
              Open Checklist →
            </button>
          </Card>
        </div>
      )}

      {/* ═══════════ SUBSCRIBERS ═══════════ */}
      {activeTab === 'subscribers' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text" placeholder="Search name, email, order #, city, zip..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', border: `2px solid ${C.blue}`, fontFamily: 'inherit', fontSize: '11px', width: '300px', background: 'white' }}
            />
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
              style={{ padding: '8px', border: `2px solid ${C.blue}`, fontFamily: 'inherit', fontSize: '11px', background: 'white' }}>
              <option value="all">All Plans</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
            <span style={{ fontSize: '10px', color: C.gray }}>
              Showing {Math.min(filteredSubs.length, 50)} of {filteredSubs.length} (total: {subscribers.length})
            </span>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredSubs.slice(0, 50).map(s => (
              <div key={s.order_id} style={{ background: 'white', border: `2px solid ${C.blue}`, padding: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <Badge color={C.blue}>#{s.order_id}</Badge>
                  <Badge color={s.subscription_type === 'Annual' ? C.pink : C.purple}>{s.subscription_type}</Badge>
                  {s.country !== 'United States' && <Badge color={C.teal}>🌐 Int'l</Badge>}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{s.name}</div>
                <div style={{ fontSize: '10px', color: C.gray }}>{s.email}</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  {s.address1}{s.address2 ? ', ' + s.address2 : ''}<br />
                  {s.city}, {s.state} {s.zip}{s.country !== 'United States' ? ', ' + s.country : ''}
                </div>
              </div>
            ))}
            {filteredSubs.length > 50 && (
              <p style={{ textAlign: 'center', color: C.gray, fontSize: '11px', padding: '12px' }}>
                Showing first 50 results. Use search to narrow down.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ GUEST LIST ═══════════ */}
      {activeTab === 'guests' && (
        <div>
          <Card title={`🎁 Guest List — ${guestList.length} recipients`} borderColor={C.purple}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <MiniStat label="Total" value={guestList.length} color={C.purple} />
              <MiniStat label="Vermont" value={guestList.filter(g => g.state === 'VT').length} color={C.teal} />
              <MiniStat label="Other States" value={guestList.filter(g => g.state !== 'VT').length} color={C.orange} />
              <MiniStat label="Also Paid" value={1} color={C.pink} />
            </div>
          </Card>
          <input
            type="text" placeholder="Search guests by name or city..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: `2px solid ${C.purple}`, fontFamily: 'inherit', fontSize: '11px', background: 'white', marginBottom: '16px', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {filteredGuests.map(g => (
              <GuestCard key={g.id} guest={g} note={guestNotes[g.id]} onSaveNote={text => saveGuestNote(g.id, text)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ GEOGRAPHY ═══════════ */}
      {activeTab === 'geography' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <Card title={`International — ${stats.intlCount} addresses, ${stats.countryCount} countries`} borderColor={C.teal}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={countryData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="country" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={C.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title={`Top US States — ${stats.usCount} addresses, ${stats.stateCount} states`} borderColor={C.blue}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={stateData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="state" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={C.blue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card title="All Countries">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px' }}>
              {Object.entries(stats.countries).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                <div key={country} style={{ padding: '6px 10px', background: C.cream, display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>{country}</span>
                  <strong style={{ color: C.teal }}>{count}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ TIMELINE ═══════════ */}
      {activeTab === 'timeline' && (
        <div>
          {/* Time window selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: C.gray, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Show:</span>
            {[
              { value: '7', label: 'Last 7 days' },
              { value: '14', label: 'Last 14 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '60', label: 'Last 60 days' },
              { value: 'all', label: 'All time' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimelineWindow(opt.value)}
                style={{
                  padding: '6px 14px',
                  border: `2px solid ${timelineWindow === opt.value ? C.orange : C.lightGray}`,
                  background: timelineWindow === opt.value ? C.orange : 'white',
                  color: timelineWindow === opt.value ? 'white' : C.black,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}
              >{opt.label}</button>
            ))}
            <span style={{ fontSize: '11px', color: C.gray, marginLeft: '8px' }}>
              {timelineData.length} days with orders
              {timelineWindow !== 'all' && timelineData.some(d => d.isPeak) && !timelineData.every(d => !d.isPeak) ? ' (★ = peak day always shown)' : ''}
            </span>
          </div>

          <Card title="Daily New Subscribers" borderColor={C.orange}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={timelineData.length > 40 ? Math.floor(timelineData.length / 30) : 0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{
                          background: 'white', padding: '10px', border: `2px solid ${C.orange}`,
                          borderRadius: '4px', fontFamily: 'inherit', fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 'bold' }}>{d.fullDate}</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: C.orange }}>{d.orders} orders</div>
                          {d.isPeak && <div style={{ color: C.pink, fontWeight: 'bold' }}>★ Peak day</div>}
                          {d.isToday && <div style={{ color: C.green, fontWeight: 'bold' }}>● Today</div>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="orders"
                  radius={[4, 4, 0, 0]}
                  fill={C.orange}
                  // Color-code: peak = pink, today = green, normal = orange
                  shape={(props) => {
                    const { x, y, width, height, payload } = props;
                    let fill = C.orange;
                    if (payload.isPeak) fill = C.pink;
                    if (payload.isToday) fill = C.green;
                    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: C.pink, borderRadius: '2px', display: 'inline-block' }}></span>
                Peak day
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: C.green, borderRadius: '2px', display: 'inline-block' }}></span>
                Today
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: C.orange, borderRadius: '2px', display: 'inline-block' }}></span>
                Other days
              </span>
            </div>
          </Card>

          {/* Stats row below chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
            {(() => {
              const peak = sortedDates.reduce((best, d) => stats.byDate[d] > (best.count || 0) ? { date: d, count: stats.byDate[d] } : best, {});
              const today = new Date().toISOString().split('T')[0];
              const todayCount = stats.byDate[today] || 0;
              const last7 = sortedDates.filter(d => d >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
              const last7Total = last7.reduce((sum, d) => sum + stats.byDate[d], 0);
              return (
                <>
                  <Metric label="Today" value={todayCount} color={C.green} />
                  <Metric label="Last 7 Days" value={last7Total} color={C.blue} />
                  <Metric label="Peak Day" value={peak.count || 0} color={C.pink} detail={peak.date || ''} />
                  <Metric label="Total Days Active" value={sortedDates.length} color={C.gray} />
                </>
              );
            })()}
          </div>

          {/* Spike callout if any single day > 100 */}
          {(() => {
            const peak = sortedDates.reduce((best, d) => stats.byDate[d] > (best.count || 0) ? { date: d, count: stats.byDate[d] } : best, {});
            if (peak.count > 100) {
              return (
                <div style={{ background: C.orange, borderRadius: '4px', padding: '20px', color: 'white', textAlign: 'center', marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>🚀 Peak Day: {peak.date}</div>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', margin: '8px 0' }}>{peak.count}</div>
                  <div>new subscribers in a single day</div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ═══════════ ISSUES ═══════════ */}
      {activeTab === 'issues' && (
        <div>
          {stats.problems === 0 ? (
            <div style={{ background: 'white', border: `2px solid ${C.green}`, padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
              <p style={{ color: C.green, fontWeight: 'bold' }}>No address issues found!</p>
              <p style={{ color: C.gray, fontSize: '11px', marginTop: '8px' }}>ALL CAPS formatting is automatically corrected.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '11px', color: C.gray, marginBottom: '10px' }}>
                Found {stats.problems} addresses with issues. <span style={{ color: C.teal }}>(ALL CAPS auto-fixed)</span>
              </p>
              {stats.problemList.map(addr => (
                <div key={addr.order_id} style={{ background: 'white', border: `2px solid ${C.orange}`, padding: '12px', marginBottom: '10px' }}>
                  <Badge color={C.blue}>#{addr.order_id}</Badge>
                  <strong style={{ marginLeft: '6px' }}>{addr.name}</strong>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    {addr.address1 || '(no address)'}, {addr.city || '(no city)'}, {addr.state} {addr.zip || '(no zip)'}
                    {addr.country !== 'United States' ? ', ' + addr.country : ''}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {addr.issues.map(issue => (
                      <span key={issue} style={{
                        display: 'inline-block', background: '#FEE', border: '1px solid #FCC',
                        padding: '2px 6px', fontSize: '9px', color: '#C00', marginRight: '4px'
                      }}>⚠️ {issue}</span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ═══════════ CANCELLATIONS ═══════════ */}
      {activeTab === 'cancellations' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <Metric label="Total Cancelled" value={stats.cancelled} color={C.red} />
            <Metric label="Churn Rate" value={`${stats.churnRate.toFixed(2)}%`} color={C.pink} />
            <Metric label="Avg Days to Cancel" value={stats.avgDaysToCancel.toFixed(1)} color={C.orange} />
            <Metric label="Monthly / Annual" value={`${stats.cancelledMonthly} / ${stats.cancelledAnnual}`} color={C.purple} />
          </div>
          {stats.cancelled === 0 ? (
            <div style={{ background: 'white', border: `2px solid ${C.green}`, padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
              <p style={{ color: C.green, fontWeight: 'bold' }}>No cancellations!</p>
            </div>
          ) : (
            <Card title="Cancelled Subscribers" borderColor={C.red}>
              {stats.cancelledList.map(o => (
                <div key={o.order_id} style={{ padding: '12px', borderBottom: `1px solid ${C.lightGray}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge color={C.red}>#{o.order_id}</Badge>
                    <strong>{o.name}</strong>
                    <span style={{ fontSize: '10px', color: C.gray }}>{o.email}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: C.gray, marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Badge color={o.subscription_type === 'Annual' ? C.pink : C.blue}>{o.subscription_type}</Badge>
                    <span>Subscribed: {o.subscription_date || o.created_at || 'N/A'}</span>
                    <span>Cancelled: {o.cancelled_at || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ DUPLICATES ═══════════ */}
      {activeTab === 'duplicates' && (
        <div>
          <Card title="Duplicate Detection" borderColor={C.purple}>
            <p style={{ fontSize: '12px', color: C.gray, marginBottom: '16px', lineHeight: 1.6 }}>
              Duplicates are caught two ways: (1) rows you flag in the Google Sheet via the <strong>duplicate_flag</strong> column are excluded first,
              then (2) the dashboard groups remaining rows by <strong>email address</strong> and keeps only the <strong>newest order</strong> (highest order ID).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <MiniStat label="Raw CSV Rows" value={stats.totalRawRows} color={C.gray} />
              <MiniStat label="Sheet-Flagged" value={stats.sheetFlaggedDupes || 0} color={C.orange} />
              <MiniStat label="Email-Detected" value={stats.duplicatesRemoved} color={C.purple} />
              <MiniStat label="Active (clean)" value={stats.total} color={C.green} />
              <MiniStat label="Cancelled" value={stats.cancelled} color={C.red} />
            </div>
          </Card>

          {((stats.sheetFlaggedDupes || 0) + stats.duplicatesRemoved) === 0 ? (
            <div style={{ background: 'white', border: `2px solid ${C.green}`, padding: '40px', textAlign: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <p style={{ color: C.green, fontWeight: 'bold' }}>No duplicates detected!</p>
              <p style={{ color: C.gray, fontSize: '11px', marginTop: '8px' }}>
                Every email in the sheet maps to exactly one active order.
              </p>
            </div>
          ) : (
            <>
              {(stats.sheetFlaggedDupes || 0) > 0 && (
                <Card title={`${stats.sheetFlaggedDupes} Sheet-Flagged Duplicate${stats.sheetFlaggedDupes !== 1 ? 's' : ''}`} borderColor={C.orange}>
                  <p style={{ fontSize: '11px', color: C.gray, marginBottom: '12px' }}>
                    These rows have a value in the <strong>duplicate_flag</strong> column in your Google Sheet and were excluded from all counts.
                  </p>
                </Card>
              )}
              {stats.duplicatesRemoved > 0 && (
                <Card title={`${stats.duplicatesRemoved} Email-Detected Duplicate${stats.duplicatesRemoved !== 1 ? 's' : ''}`} borderColor={C.purple}>
                  <p style={{ fontSize: '11px', color: C.gray, marginBottom: '12px' }}>
                    These older orders were removed because a newer order exists for the same email.
                    The "Kept" column shows which order ID was retained.
                  </p>
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {stats.duplicateList.map((d, i) => (
                      <div key={`${d.order_id}-${i}`} style={{
                        padding: '10px', borderBottom: `1px solid ${C.lightGray}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                            <Badge color={C.purple}>#{d.order_id}</Badge>
                            <span style={{ textDecoration: 'line-through', color: C.gray, fontSize: '12px' }}>{d.name}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: C.gray }}>{d.email}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: C.green }}>Kept: #{d._kept_order}</div>
                          <Badge color={d.subscription_type === 'Annual' ? C.pink : C.blue}>{d.subscription_type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════ FULFILLMENT CHECKLIST ═══════════ */}
      {activeTab === 'fulfillment' && (
        <div>
          <Card title="Monthly Fulfillment Checklist" borderColor={C.green}>
            <div style={{
              background: C.cream, border: `2px solid ${C.orange}`, padding: '12px', marginBottom: '20px',
              fontSize: '12px', color: C.orange, fontWeight: 'bold'
            }}>
              ⚠️ QA REMINDER: Verify subscriber list against Squarespace Pending Orders export before printing labels.
            </div>
            <div style={{
              background: C.cream, border: `2px solid ${C.blue}`, padding: '12px', marginBottom: '20px',
              fontSize: '11px'
            }}>
              <a href={MASTER_SHEET_URL} target="_blank" rel="noopener noreferrer"
                style={{ color: C.blue, fontWeight: 'bold', textDecoration: 'underline' }}>
                📋 Open TCR Operations — Master Google Sheet
              </a>
            </div>
            <div style={{ marginBottom: '16px' }}>
              {checklistItems.map(item => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                    borderBottom: `1px solid ${C.lightGray}`, cursor: 'pointer',
                    background: checklist[item.key] ? '#f0fdf0' : 'transparent',
                    fontSize: '12px'
                  }}
                  onClick={() => toggleCheck(item.key)}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '3px',
                    border: `2px solid ${checklist[item.key] ? C.green : C.lightGray}`,
                    background: checklist[item.key] ? C.green : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                  }}>
                    {checklist[item.key] && '✓'}
                  </span>
                  <span style={{ textDecoration: checklist[item.key] ? 'line-through' : 'none', color: checklist[item.key] ? C.gray : C.black }}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: checklistDone === checklistItems.length ? C.green : C.blue }}>
                {checklistDone}/{checklistItems.length} complete
                {checklistDone === checklistItems.length && ' 🎉'}
              </div>
              <button
                onClick={resetChecklist}
                style={{ padding: '4px 10px', border: `1px solid ${C.gray}`, background: 'white', color: C.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px' }}
              >
                Reset Checklist
              </button>
            </div>
          </Card>

          {/* Quick reference numbers */}
          <Card title="Label Count Reference" borderColor={C.teal}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <MiniStat label="US Subscribers" value={stats.usCount} color={C.blue} />
              <MiniStat label="Int'l Subscribers" value={stats.intlCount} color={C.teal} />
              <MiniStat label="Guest List" value={guestList.length} color={C.purple} />
              <MiniStat label="Total Labels" value={stats.totalMailingList} color={C.green} />
            </div>
            <p style={{ fontSize: '10px', color: C.gray, marginTop: '10px' }}>
              Total = {stats.total} paid + {guestList.length} guests − 1 overlap (Sophie Cassel) = {stats.totalMailingList}
            </p>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '9px', color: C.gray, textTransform: 'uppercase', letterSpacing: '2px' }}>
        The Cloud Report • Dashboard v8 • Live from Google Sheets • ☁️
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Metric({ label, value, color, detail, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px', background: color, color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '2px'
      }}
    >
      <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1.2 }}>{value}</div>
      {detail && <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>{detail}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: 'white', border: `2px solid ${C.lightGray}`, borderRadius: '2px' }}>
      <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '10px', color: C.gray }}>{label}</div>
    </div>
  );
}

function Card({ title, children, borderColor }) {
  return (
    <div style={{ background: 'white', border: `2px solid ${borderColor || C.blue}`, padding: '16px', marginBottom: '16px' }}>
      {title && <h3 style={{ color: borderColor || C.blue, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>{title}</h3>}
      {children}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{ padding: '2px 6px', fontSize: '9px', textTransform: 'uppercase', color: 'white', background: color, display: 'inline-block' }}>
      {children}
    </span>
  );
}

function GuestCard({ guest, note, onSaveNote }) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(note || '');

  return (
    <div style={{ background: 'white', border: `2px solid ${C.lightGray}`, borderLeft: `4px solid ${C.purple}`, padding: '12px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '12px', color: C.purple, marginBottom: '4px' }}>{guest.name}</div>
      <div style={{ fontSize: '11px', color: C.gray }}>{guest.address}</div>
      <div style={{ fontSize: '11px', color: C.gray }}>{guest.city}, {guest.state} {guest.zip}</div>
      {guest.note && (
        <div style={{ marginTop: '6px', padding: '4px 8px', background: C.cream, fontSize: '10px', color: C.orange }}>
          ⚠️ {guest.note}
        </div>
      )}
      <button
        onClick={() => setShowNote(!showNote)}
        style={{ marginTop: '8px', padding: '4px 8px', border: `1px solid ${C.lightGray}`, background: 'transparent', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}
      >
        {showNote ? 'Hide' : (note ? '📝 Note' : '+ Note')}
      </button>
      {showNote && (
        <div style={{ marginTop: '8px' }}>
          <textarea
            value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Note..." rows={2}
            style={{ width: '100%', padding: '6px', border: `1px solid ${C.lightGray}`, fontFamily: 'inherit', fontSize: '11px', boxSizing: 'border-box' }}
          />
          <button
            onClick={() => onSaveNote(noteText)}
            style={{ marginTop: '4px', padding: '4px 10px', background: C.purple, color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
