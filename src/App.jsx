import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// THE CLOUD REPORT DASHBOARD v7 - LIVE DATA
// Fetches directly from Google Sheets
// ═══════════════════════════════════════════════════════════════════════════════

const GOOGLE_SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1yLuGQtnu9QWsLhJD2F02H19teD134ohZk-_WqSfuTeZnOGf-6rZNt2NCu8LBMGBjm7py8KwFO23l/pub?gid=1234159284&single=true&output=csv';

const COLORS = {
  blue: '#0078BF',
  pink: '#F15060',
  green: '#00A95C',
  orange: '#FF6C2F',
  purple: '#765BA7',
  teal: '#00838A',
  red: '#E02B35',
  cream: '#FAF3E8',
  black: '#1a1a1a',
  gray: '#666666',
  lightGray: '#e8e8e8'
};

// Guest list (manual recipients - stored separately)
const GUEST_LIST = [
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
  { id: 12, name: 'Allison Cassity', address: '115 Isaac Lane', city: 'Hazel Green', state: 'AL', zip: '35750' },
  { id: 13, name: 'Ainsley Judge & Adrian O\'Barr', address: '65 Lexington Ave', city: 'Portland', state: 'ME', zip: '04103' },
  { id: 14, name: 'Zoe Richards', address: '15 Catherine St.', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 15, name: 'Lauren Mazel', address: '10836 Douglas Ave', city: 'Silver Spring', state: 'MD', zip: '20902' },
  { id: 16, name: 'Eliza Rosenberry', address: '2326 Hoard St', city: 'Madison', state: 'WI', zip: '53704' },
  { id: 17, name: 'Meghan Oretsky', address: '1773 College View Pl.', city: 'Los Angeles', state: 'CA', zip: '90041' },
  { id: 18, name: 'Cayla Tepper', address: '3952 W Waveland Ave #3', city: 'Chicago', state: 'IL', zip: '60618' },
  { id: 19, name: 'Isabella Thorndike', address: '369 Granite St', city: 'Ashland', state: 'OR', zip: '97520' },
  { id: 20, name: 'Cheryl Pespisa', address: '3 Washington St.', city: 'Bedford', state: 'MA', zip: '01730' },
  { id: 21, name: 'Alexandra Rose & Myles Jewell', address: '44 Saratoga Ave', city: 'Burlington', state: 'VT', zip: '05408' },
  { id: 22, name: 'Katie Palatucci', address: '91 Spruce St', city: 'Burlington', state: 'VT', zip: '05401' },
  { id: 23, name: 'Jon Balderston', address: '2527 Virginia St', city: 'Berkeley', state: 'CA', zip: '94709' }
];

// Annual gift recipients
const ANNUAL_GIFTS = [
  { id: 1, name: 'Amy Dohner', address: '4848 Greenbrier Rd', city: 'North Ferrisburg', state: 'VT', zip: '05473' },
  { id: 2, name: 'Kate Hobbs & Lynn Kessler', address: '966 60th St', city: 'Oakland', state: 'CA', zip: '94608' },
  { id: 3, name: 'Robin Holland', address: '14 Outlook Ave', city: 'Ballston Spa', state: 'NY', zip: '12020' },
  { id: 4, name: 'Uli Schygulla', address: '4593 Tuppers Xing', city: 'Vergennes', state: 'VT', zip: '05491' },
  { id: 5, name: 'LJ Robertson', address: '123 Fake St', city: 'Brooklyn', state: 'NY', zip: '11201' },
  { id: 6, name: 'Alice Robertson', address: '456 Sample Ave', city: 'Washington', state: 'DC', zip: '20001' }
];

export default function CloudReportDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Fetch data from Google Sheets
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(GOOGLE_SHEET_CSV);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
          setLastFetched(new Date());
          setLoading(false);
        },
        error: (err) => {
          setError('Failed to parse data: ' + err.message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      setLoading(false);
    }
  };

  // Process raw CSV data into stats
  const processData = (data) => {
    // Filter for valid rows with order_id
    const allRows = data.filter(row => row.order_id && row.name);
    
    // Active vs cancelled
    const active = allRows.filter(r => r.status === 'active');
    const cancelled = allRows.filter(r => r.status === 'cancelled' || r.status === 'canceled');
    
    // Plan breakdown
    const monthly = active.filter(r => r.plan === 'Monthly');
    const annual = active.filter(r => r.plan === 'Annual');
    
    // Revenue
    const mrr = (monthly.length * 8) + (annual.length * 6.40);
    
    // Geography
    const usSubscribers = active.filter(r => r.country === 'United States');
    const intlSubscribers = active.filter(r => r.country && r.country !== 'United States');
    
    // Country breakdown
    const countries = {};
    active.forEach(r => {
      const c = r.country || 'Unknown';
      countries[c] = (countries[c] || 0) + 1;
    });
    const countryList = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }));
    
    // US State breakdown
    const states = {};
    usSubscribers.forEach(r => {
      const s = r.state || 'Unknown';
      states[s] = (states[s] || 0) + 1;
    });
    const stateList = Object.entries(states)
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({ state, count }));
    
    // Timeline - group by created_at date
    const byDate = {};
    active.forEach(r => {
      if (r.created_at) {
        const date = r.created_at.split(' ')[0].split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      }
    });
    const timeline = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), fullDate: date, orders: count }));
    
    // Cumulative growth
    let cumulative = 0;
    const growth = timeline.map(d => {
      cumulative += d.orders;
      return { date: d.date, fullDate: d.fullDate, total: cumulative };
    });
    
    setSubscribers(active);
    setStats({
      total: active.length,
      monthly: monthly.length,
      annual: annual.length,
      mrr,
      arr: mrr * 12,
      cancelled: cancelled.length,
      churnRate: allRows.length > 0 ? ((cancelled.length / allRows.length) * 100).toFixed(2) : 0,
      usCount: usSubscribers.length,
      intlCount: intlSubscribers.length,
      countryCount: Object.keys(countries).length,
      stateCount: Object.keys(states).length,
      countryList,
      stateList,
      timeline,
      growth,
      cancelledList: cancelled,
      guestCount: GUEST_LIST.length,
      giftCount: ANNUAL_GIFTS.length
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subscribers for search
  const filteredSubscribers = subscribers.filter(sub => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      (sub.name && sub.name.toLowerCase().includes(term)) ||
      (sub.email && sub.email.toLowerCase().includes(term)) ||
      (sub.city && sub.city.toLowerCase().includes(term)) ||
      (sub.order_id && sub.order_id.includes(searchTerm));
    const matchesPlan = planFilter === 'all' || (sub.plan && sub.plan.toLowerCase() === planFilter);
    return matchesSearch && matchesPlan;
  });

  // Filter guests
  const filteredGuests = GUEST_LIST.filter(guest => {
    return searchTerm === '' ||
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.city.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const tabs = [
    { id: 'overview', label: '☁️ Overview', color: COLORS.blue },
    { id: 'subscribers', label: '👥 Subscribers', color: COLORS.green },
    { id: 'guests', label: '🎁 Guest List', color: COLORS.purple },
    { id: 'geography', label: '🌍 Geography', color: COLORS.teal },
    { id: 'timeline', label: '📈 Timeline', color: COLORS.orange },
    { id: 'cancellations', label: '📉 Cancellations', color: COLORS.red }
  ];

  if (loading) {
    return (
      <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: COLORS.cream, minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ color: COLORS.blue, marginBottom: '20px' }}>☁️ THE CLOUD REPORT</h1>
        <p style={{ color: COLORS.gray }}>Loading live data from Google Sheets...</p>
        <div style={{ marginTop: '20px', fontSize: '32px' }}>⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: COLORS.cream, minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ color: COLORS.red, marginBottom: '20px' }}>Error Loading Data</h1>
        <p style={{ color: COLORS.gray }}>{error}</p>
        <button onClick={fetchData} style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: COLORS.blue, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  const totalMailing = stats.total + stats.guestCount + stats.giftCount;

  return (
    <div style={{ fontFamily: '"Courier New", monospace', backgroundColor: COLORS.cream, minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.black, marginBottom: '8px' }}>
          ☁️ THE CLOUD REPORT
        </h1>
        <p style={{ color: COLORS.gray, fontSize: '14px' }}>
          Dashboard v7 • Live Data from Google Sheets
        </p>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: COLORS.teal }}>
            Last updated: {lastFetched ? lastFetched.toLocaleString() : 'Never'}
          </span>
          <button 
            onClick={fetchData}
            style={{ padding: '6px 12px', backgroundColor: COLORS.blue, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
              backgroundColor: activeTab === tab.id ? tab.color : 'white',
              color: activeTab === tab.id ? 'white' : COLORS.black,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {tab.label}
            {tab.id === 'cancellations' && stats.cancelled > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: 'white', color: COLORS.red, padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                {stats.cancelled}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard label="Total Mailing List" value={totalMailing.toLocaleString()} color={COLORS.blue} detail={`${stats.total} paid + ${stats.guestCount} guests + ${stats.giftCount} gifts`} />
            <MetricCard label="Monthly Revenue" value={`$${stats.mrr.toFixed(0)}`} color={COLORS.green} detail="MRR" />
            <MetricCard label="Annual Revenue" value={`$${stats.arr.toFixed(0)}`} color={COLORS.teal} detail="ARR (projected)" />
            <MetricCard label="Churn Rate" value={`${stats.churnRate}%`} color={COLORS.pink} detail={`${stats.cancelled} cancelled`} />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Plan Mix */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
              <h3 style={{ marginBottom: '16px', color: COLORS.black }}>Plan Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Monthly', value: stats.monthly },
                      { name: 'Annual', value: stats.annual }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill={COLORS.blue} />
                    <Cell fill={COLORS.orange} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: COLORS.blue, borderRadius: '2px' }}></span>
                  Monthly ($8/mo)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: COLORS.orange, borderRadius: '2px' }}></span>
                  Annual ($76.80/yr)
                </span>
              </div>
            </div>

            {/* Growth Chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
              <h3 style={{ marginBottom: '16px', color: COLORS.black }}>Cumulative Growth</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.growth.slice(-14)}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geography Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <MiniCard label="US Addresses" value={stats.usCount} color={COLORS.blue} />
            <MiniCard label="International" value={stats.intlCount} color={COLORS.teal} />
            <MiniCard label="Countries" value={stats.countryCount} color={COLORS.purple} />
            <MiniCard label="US States" value={stats.stateCount} color={COLORS.green} />
            <MiniCard label="Manual Recipients" value={stats.guestCount + stats.giftCount} color={COLORS.orange} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SUBSCRIBERS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'subscribers' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by name, email, city, order #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '250px', padding: '12px 16px', border: `2px solid ${COLORS.lightGray}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ padding: '12px 16px', border: `2px solid ${COLORS.lightGray}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="all">All Plans</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <p style={{ marginBottom: '16px', color: COLORS.gray, fontSize: '13px' }}>
            Showing {filteredSubscribers.length} of {subscribers.length} active subscribers
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
            {filteredSubscribers.slice(0, 100).map(sub => (
              <div key={sub.order_id} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '16px',
                border: `2px solid ${COLORS.lightGray}`,
                borderLeft: `4px solid ${sub.plan === 'Annual' ? COLORS.orange : COLORS.blue}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{sub.name}</div>
                    <div style={{ color: COLORS.gray, fontSize: '13px' }}>{sub.email}</div>
                    <div style={{ color: COLORS.gray, fontSize: '13px' }}>
                      {sub.city}, {sub.state} {sub.zip} {sub.country !== 'United States' && `• ${sub.country}`}
                    </div>
                    {sub.notes && <div style={{ color: COLORS.orange, fontSize: '12px', marginTop: '4px' }}>📝 {sub.notes}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: sub.plan === 'Annual' ? COLORS.orange : COLORS.blue,
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {sub.plan}
                    </span>
                    <div style={{ color: COLORS.gray, fontSize: '11px', marginTop: '4px' }}>#{sub.order_id}</div>
                  </div>
                </div>
              </div>
            ))}
            {filteredSubscribers.length > 100 && (
              <p style={{ textAlign: 'center', color: COLORS.gray, fontSize: '12px', padding: '12px' }}>
                Showing first 100 results. Use search to narrow down.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GUEST LIST TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'guests' && (
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.purple}`, marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', color: COLORS.purple }}>🎁 Manual Recipients</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.purple }}>{GUEST_LIST.length}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>Guest List</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.orange }}>{ANNUAL_GIFTS.length}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>Annual Gifts</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.teal }}>{GUEST_LIST.length + ANNUAL_GIFTS.length}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>Total Manual</div>
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', border: `2px solid ${COLORS.lightGray}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' }}
          />

          <h4 style={{ color: COLORS.purple, marginBottom: '12px' }}>Guest List ({GUEST_LIST.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {filteredGuests.map(guest => (
              <div key={guest.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: `2px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.purple}` }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: COLORS.purple }}>{guest.name}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>{guest.address}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>{guest.city}, {guest.state} {guest.zip}</div>
                {guest.note && <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: COLORS.cream, borderRadius: '4px', fontSize: '12px', color: COLORS.orange }}>⚠️ {guest.note}</div>}
              </div>
            ))}
          </div>

          <h4 style={{ color: COLORS.orange, marginBottom: '12px' }}>Annual Gifts ({ANNUAL_GIFTS.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {ANNUAL_GIFTS.map(gift => (
              <div key={gift.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: `2px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.orange}` }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: COLORS.orange }}>{gift.name}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>{gift.address}</div>
                <div style={{ color: COLORS.gray, fontSize: '13px' }}>{gift.city}, {gift.state} {gift.zip}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GEOGRAPHY TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'geography' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Countries */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
              <h3 style={{ marginBottom: '16px', color: COLORS.black }}>
                International ({stats.intlCount} addresses, {stats.countryCount} countries)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.countryList.filter(c => c.country !== 'United States').slice(0, 12)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="country" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* US States */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
              <h3 style={{ marginBottom: '16px', color: COLORS.black }}>
                US States ({stats.usCount} addresses, {stats.stateCount} states)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.stateList.slice(0, 12)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="state" type="category" width={50} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All countries */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}`, marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: COLORS.black }}>All Countries</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              {stats.countryList.map(c => (
                <div key={c.country} style={{ padding: '8px 12px', backgroundColor: COLORS.cream, borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.country}</span>
                  <span style={{ fontWeight: 'bold', color: COLORS.teal }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TIMELINE TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}`, marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: COLORS.black }}>Daily New Subscribers</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.timeline.slice(-30)}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent activity */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
            <h3 style={{ marginBottom: '16px', color: COLORS.black }}>Recent Days</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {stats.timeline.slice(-7).reverse().map(d => (
                <div key={d.fullDate} style={{ padding: '16px', backgroundColor: COLORS.cream, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.orange }}>{d.orders}</div>
                  <div style={{ fontSize: '12px', color: COLORS.gray }}>{d.fullDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CANCELLATIONS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cancellations' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <MetricCard label="Total Cancelled" value={stats.cancelled} color={COLORS.red} />
            <MetricCard label="Churn Rate" value={`${stats.churnRate}%`} color={COLORS.pink} />
          </div>

          {stats.cancelled === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: `3px solid ${COLORS.green}` }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <p style={{ color: COLORS.green, fontWeight: 'bold', fontSize: '18px' }}>No cancellations!</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: `3px solid ${COLORS.lightGray}` }}>
              <h3 style={{ marginBottom: '16px', color: COLORS.black }}>Cancelled Subscribers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.cancelledList.map(sub => (
                  <div key={sub.order_id} style={{ padding: '16px', backgroundColor: COLORS.cream, borderRadius: '8px', borderLeft: `4px solid ${COLORS.red}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{sub.name}</div>
                        <div style={{ color: COLORS.gray, fontSize: '13px' }}>{sub.email}</div>
                      </div>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: sub.plan === 'Annual' ? COLORS.orange : COLORS.blue, color: 'white', fontSize: '12px' }}>
                        {sub.plan}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.gray }}>
                      Order #{sub.order_id} • Created: {sub.created_at}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: `2px solid ${COLORS.lightGray}`, color: COLORS.gray, fontSize: '12px' }}>
        The Cloud Report Dashboard v7 • Live Data • 
        <span style={{ color: COLORS.teal }}> Connected to Google Sheets</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({ label, value, color, detail }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', borderLeft: `5px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
      {detail && <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{detail}</div>}
    </div>
  );
}

function MiniCard({ label, value, color }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', textAlign: 'center', border: '2px solid #e8e8e8' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#666', fontSize: '12px' }}>{label}</div>
    </div>
  );
}
