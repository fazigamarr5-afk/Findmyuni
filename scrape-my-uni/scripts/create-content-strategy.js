import XLSX from 'xlsx';

const wb = XLSX.utils.book_new();

// Sheet 1: Content Calendar
const calendarData = [
  ['Week', 'Topic', 'Type', 'Pillar', 'Target Keyword', 'Buyer Stage', 'Word Count', 'Status', 'Deadline'],
  [1, 'LUMS Admission Guide 2026', 'Searchable', 'Admissions', 'LUMS admission 2026', 'Consideration', 2000, 'Not Started', '2026-09-11'],
  [1, 'Best CS Universities in Lahore', 'Searchable', 'Rankings', 'best CS universities Lahore', 'Consideration', 1800, 'Not Started', '2026-09-11'],
  [2, 'FAST Admission Guide 2026', 'Searchable', 'Admissions', 'FAST admission 2026', 'Consideration', 2000, 'Not Started', '2026-09-18'],
  [2, 'PEEF Scholarship Guide 2026', 'Searchable', 'Scholarships', 'PEEF scholarship 2026', 'Decision', 1500, 'Not Started', '2026-09-18'],
  [3, 'MDCAT Preparation Guide', 'Searchable', 'Admissions', 'MDCAT preparation 2026', 'Consideration', 2500, 'Not Started', '2026-09-25'],
  [3, 'NUST vs FAST for CS', 'Both', 'Comparisons', 'NUST vs FAST', 'Consideration', 1800, 'Not Started', '2026-09-25'],
  [4, 'Best Engineering Universities', 'Searchable', 'Rankings', 'best engineering universities Pakistan', 'Awareness', 2000, 'Not Started', '2026-10-02'],
  [4, 'How to Choose a University', 'Both', 'Tips', 'how to choose university Pakistan', 'Awareness', 1500, 'Not Started', '2026-10-02'],
  [5, 'COMSATS Admission Guide', 'Searchable', 'Admissions', 'COMSATS admission 2026', 'Consideration', 1800, 'Not Started', '2026-10-09'],
  [5, 'Ehsaas Scholarship Guide', 'Searchable', 'Scholarships', 'Ehsaas scholarship 2026', 'Decision', 1500, 'Not Started', '2026-10-09'],
  [6, 'Best Universities in Karachi', 'Searchable', 'Rankings', 'best universities Karachi', 'Consideration', 1800, 'Not Started', '2026-10-16'],
  [6, 'LUMS NOP Complete Guide', 'Searchable', 'Scholarships', 'LUMS NOP 2026', 'Decision', 2000, 'Not Started', '2026-10-16'],
  [7, 'QAU Admission Guide', 'Searchable', 'Admissions', 'QAU admission 2026', 'Consideration', 1500, 'Not Started', '2026-10-23'],
  [7, 'Best Medical Colleges Pakistan', 'Searchable', 'Rankings', 'best medical colleges Pakistan', 'Consideration', 2000, 'Not Started', '2026-10-23'],
  [8, 'GIKI Admission Guide', 'Searchable', 'Admissions', 'GIKI admission 2026', 'Consideration', 1500, 'Not Started', '2026-10-30'],
  [8, 'HEC Overseas Scholarship Guide', 'Searchable', 'Scholarships', 'HEC overseas scholarship', 'Decision', 2000, 'Not Started', '2026-10-30']
];
const ws1 = XLSX.utils.aoa_to_sheet(calendarData);
XLSX.utils.book_append_sheet(wb, ws1, 'Content Calendar');

// Sheet 2: Content Pillars
const pillarsData = [
  ['Pillar', 'Description', 'Content %', 'Target Pieces', 'Published', 'Remaining'],
  ['University Rankings', 'Rankings, comparisons, HEC categories', '30%', 15, 4, 11],
  ['Admissions & Entry Tests', 'University-specific guides, test prep', '30%', 15, 2, 13],
  ['Scholarships & Financial Aid', 'Scholarship guides, financial aid', '20%', 10, 1, 9],
  ['Career & Study Abroad', 'Career paths, international options', '15%', 8, 2, 6],
  ['Student Life & Tips', 'Campus life, application tips', '5%', 5, 1, 4]
];
const ws2 = XLSX.utils.aoa_to_sheet(pillarsData);
XLSX.utils.book_append_sheet(wb, ws2, 'Content Pillars');

// Sheet 3: Published Content
const publishedData = [
  ['Title', 'URL', 'Type', 'Pillar', 'Target Keyword', 'Word Count', 'Status'],
  ['Top 10 Universities in Pakistan 2026', '/blog/top-10-universities-pakistan-2026', 'Searchable', 'Rankings', 'top 10 universities Pakistan', 3000, 'Published'],
  ['NUST Admission 2026 Guide', '/blog/nust-admission-2026-guide-net-test', 'Searchable', 'Admissions', 'NUST admission 2026', 2500, 'Published'],
  ['Best CS Universities in Pakistan 2026', '/blog/best-cs-universities-pakistan-2026', 'Searchable', 'Rankings', 'best CS universities Pakistan', 2000, 'Published'],
  ['University Scholarships Guide 2026', '/blog/university-scholarships-pakistan-2026', 'Searchable', 'Scholarships', 'university scholarships Pakistan', 2500, 'Published'],
  ['Public vs Private Universities', '/blog/public-vs-private-universities-pakistan', 'Both', 'Rankings', 'public vs private universities', 1800, 'Published'],
  ['Personal Statement Guide', '/blog/write-perfect-university-personal-statement', 'Searchable', 'Tips', 'personal statement university', 2000, 'Published'],
  ['HEC Categories Explained', '/blog/hec-university-categories-wxyz-explained', 'Searchable', 'Rankings', 'HEC categories W X Y Z', 1500, 'Published'],
  ['Engineering Admissions Guide', '/blog/engineering-admissions-pakistan-2026-ecat', 'Searchable', 'Admissions', 'ECAT preparation 2026', 2000, 'Published'],
  ['Career Options for Graduates', '/blog/career-options-pakistani-graduates-2026', 'Searchable', 'Career', 'career options Pakistan', 2000, 'Published'],
  ['Study Abroad Guide', '/blog/pakistani-students-studying-abroad-guide', 'Searchable', 'Career', 'study abroad Pakistan', 2500, 'Published'],
  ['NUST vs LUMS Comparison', '/comparisons/nust-vs-lums', 'Both', 'Comparisons', 'NUST vs LUMS', 2000, 'Published'],
  ['FAST vs NUST for CS', '/comparisons/fast-vs-nust-cs', 'Both', 'Comparisons', 'FAST vs NUST CS', 1800, 'Published'],
  ['Best University Search Tools', '/comparisons/best-university-search-tools-pakistan', 'Both', 'Rankings', 'best university search Pakistan', 1500, 'Published']
];
const ws3 = XLSX.utils.aoa_to_sheet(publishedData);
XLSX.utils.book_append_sheet(wb, ws3, 'Published Content');

// Sheet 4: Keyword Opportunities
const keywordsData = [
  ['Keyword', 'Est. Monthly Volume', 'Competition', 'Current Position', 'Priority', 'Content Type', 'Buyer Stage'],
  ['LUMS admission 2026', 5000, 'Low', 'Not Ranking', 'High', 'Searchable', 'Consideration'],
  ['FAST admission 2026', 4000, 'Low', 'Not Ranking', 'High', 'Searchable', 'Consideration'],
  ['MDCAT preparation 2026', 8000, 'Medium', 'Not Ranking', 'High', 'Searchable', 'Consideration'],
  ['best CS universities Lahore', 2000, 'Low', 'Not Ranking', 'High', 'Searchable', 'Consideration'],
  ['PEEF scholarship 2026', 3000, 'Low', 'Not Ranking', 'Medium', 'Searchable', 'Decision'],
  ['COMSATS admission 2026', 2500, 'Low', 'Not Ranking', 'Medium', 'Searchable', 'Consideration'],
  ['Ehsaas scholarship 2026', 4000, 'Low', 'Not Ranking', 'Medium', 'Searchable', 'Decision'],
  ['best engineering universities Pakistan', 3000, 'Medium', 'Not Ranking', 'Medium', 'Searchable', 'Consideration'],
  ['NUST vs FAST', 1500, 'Low', 'Ranking #1', 'Maintain', 'Both', 'Consideration'],
  ['university scholarships Pakistan', 2000, 'Medium', 'Ranking #1', 'Maintain', 'Searchable', 'Decision'],
  ['top 10 universities Pakistan', 5000, 'Medium', 'Ranking #1', 'Maintain', 'Searchable', 'Awareness'],
  ['HEC categories Pakistan', 1500, 'Low', 'Ranking #1', 'Maintain', 'Searchable', 'Awareness']
];
const ws4 = XLSX.utils.aoa_to_sheet(keywordsData);
XLSX.utils.book_append_sheet(wb, ws4, 'Keyword Opportunities');

// Sheet 5: Success Metrics
const metricsData = [
  ['Metric', 'Current', 'Month 1 Target', 'Month 3 Target', 'Month 6 Target'],
  ['Monthly Visitors', 0, 1000, 5000, 20000],
  ['Indexed Pages', 50, 75, 100, 200],
  ['Published Blog Posts', 10, 18, 30, 50],
  ['Comparison Pages', 3, 5, 8, 12],
  ['Backlinks', 0, 10, 30, 100],
  ['User Signups', 0, 100, 500, 2000],
  ['Avg. Time on Page', 'N/A', '2:00', '3:00', '4:00'],
  ['Bounce Rate', 'N/A', '<70%', '<60%', '<50%']
];
const ws5 = XLSX.utils.aoa_to_sheet(metricsData);
XLSX.utils.book_append_sheet(wb, ws5, 'Success Metrics');

// Sheet 6: Distribution Channels
const distributionData = [
  ['Channel', 'Type', 'Frequency', 'Content Format', 'Goal'],
  ['Facebook Groups', 'Rented', '3x/week', 'Blog links, infographics', 'Traffic'],
  ['Instagram', 'Rented', 'Daily', 'Tips, campus photos, reels', 'Brand awareness'],
  ['YouTube', 'Rented', '1x/week', 'University tours, tips', 'Authority'],
  ['TikTok', 'Rented', '3x/week', 'Quick tips, student stories', 'Reach'],
  ['Email Newsletter', 'Owned', 'Weekly', 'Admission updates, new posts', 'Retention'],
  ['WhatsApp Broadcast', 'Owned', '2x/week', 'Deadline reminders', 'Engagement'],
  ['Guest Posts', 'Borrowed', '1x/month', 'Long-form articles', 'Backlinks'],
  ['Podcast Appearances', 'Borrowed', '1x/month', 'Interviews', 'Authority']
];
const ws6 = XLSX.utils.aoa_to_sheet(distributionData);
XLSX.utils.book_append_sheet(wb, ws6, 'Distribution Channels');

// Save file
const fileName = 'FindMyUni-Content-Strategy.xlsx';
XLSX.writeFile(wb, fileName);
console.log('Excel file created: ' + fileName);
