-- ============================================
-- Seed Data: Pakistani Universities for FindMyUni
-- Run this AFTER schema.sql
-- ============================================

INSERT INTO universities (name, description, url, apply_link, admission_open, basic_info, programs, scholarships, facilities) VALUES

-- 1. NUST
(
  'National University of Sciences & Technology (NUST)',
  'NUST is a public research university in Islamabad, ranked #1 in Pakistan. It offers undergraduate, graduate, and postgraduate programs in engineering, science, business, and architecture.',
  'https://www.nust.edu.pk',
  'https://www.nust.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "1991", "Type": "Research University", "Ranking": "1", "Deadline to Apply": "15 Jul 2026", "Tuition Range": "PKR 150,000 - 350,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science", "Physics", "Mathematics", "Chemistry", "Business Administration", "Architecture"], "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Structural Engineering", "Business Administration", "Project Management"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]}'::jsonb,
  '{"need_based": true, "merit_based": true, "hbl_need_based": "Need-based scholarships covering tuition and living expenses", "hec_scholarships": "HEC and foreign funded scholarships available"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": true}'::jsonb
),

-- 2. LUMS
(
  'Lahore University of Management Sciences (LUMS)',
  'LUMS is a private research university in Lahore, known for its business school, computer science, and engineering programs. It offers a liberal arts education with a focus on critical thinking.',
  'https://lums.edu.pk',
  'https://lums.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Private", "Established": "1984", "Type": "Research University", "Ranking": "2", "Deadline to Apply": "31 Jul 2026", "Tuition Range": "PKR 500,000 - 800,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Electrical Engineering", "Chemical Engineering", "Civil Engineering", "Economics", "Political Science", "Psychology", "Sociology", "Anthropology", "English", "History", "Mathematics", "Physics", "Biology", "Business Administration"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Business Administration", "Economics", "Education"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Economics", "Education"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "fafsa_financial_aid": "Comprehensive financial aid program covering up to 100% of tuition"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": false, "swimming_pool": true, "auditorium": true}'::jsonb
),

-- 3. UET Lahore
(
  'University of Engineering & Technology (UET) Lahore',
  'UET Lahore is the oldest and largest engineering university in Pakistan. It offers a wide range of engineering and technology programs with strong industry connections.',
  'https://uet.edu.pk',
  'https://uet.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Public", "Established": "1921", "Type": "Engineering University", "Ranking": "3", "Deadline to Apply": "10 Jul 2026", "Tuition Range": "PKR 80,000 - 200,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Science", "Software Engineering", "Architecture", "City & Regional Planning", "Metallurgy & Materials Engineering", "Mining Engineering", "Petroleum Engineering"], "MSPrograms": ["Structural Engineering", "Transportation Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"], "PhDPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "hec_scholarships": "HEC and provincial scholarships available"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": true}'::jsonb
),

-- 4. Punjab University
(
  'University of the Punjab',
  'The University of the Punjab is the oldest university in Pakistan, established in 1882. It offers programs across arts, science, engineering, medicine, law, and commerce.',
  'https://pu.edu.pk',
  'https://pu.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Public", "Established": "1882", "Type": "Comprehensive University", "Ranking": "4", "Deadline to Apply": "20 Jul 2026", "Tuition Range": "PKR 50,000 - 150,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "Psychology", "English", "Urdu", "Business Administration", "Commerce", "Law", "Medicine"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Economics", "Political Science", "English"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry", "Economics", "English"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "pu_scholarships": "PU need-based and merit-based scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 5. FAST-NUCES
(
  'FAST National University of Computer & Emerging Sciences',
  'FAST-NUCES is Pakistan\'s leading computer science and technology university, known for its rigorous CS curriculum and strong industry placements.',
  'https://nu.edu.pk',
  'https://nu.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Private", "Established": "1980", "Type": "Technology University", "Ranking": "5", "Deadline to Apply": "25 Jul 2026", "Tuition Range": "PKR 250,000 - 400,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Artificial Intelligence", "Data Science", "Information Technology", "Cyber Security", "Financial Technology"], "MSPrograms": ["Computer Science", "Software Engineering", "Data Science", "Cyber Security"], "PhDPrograms": ["Computer Science"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "fast_scholarships": "FAST merit and need-based scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 6. GCU Lahore
(
  'Government College University (GCU) Lahore',
  'GCU Lahore is one of the oldest and most prestigious institutions in South Asia, known for its academic excellence and distinguished alumni including Nobel laureates.',
  'https://gc.uop.edu.pk',
  'https://gc.uop.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Public", "Established": "1864", "Type": "Comprehensive University", "Ranking": "6", "Deadline to Apply": "18 Jul 2026", "Tuition Range": "PKR 40,000 - 120,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Urdu", "Political Science", "Psychology", "Sociology", "Commerce"], "MSPrograms": ["Physics", "Chemistry", "Mathematics", "Economics", "English"], "PhDPrograms": ["Physics", "Chemistry", "Mathematics"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "gc_scholarships": "GCU merit and need-based scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "heritage_building": true}'::jsonb
),

-- 7. COMSATS
(
  'COMSATS University Islamabad',
  'COMSATS is a multi-campus public university known for its IT and science programs. It has campuses across Pakistan and strong research output.',
  'https://www.comsats.edu.pk',
  'https://www.comsats.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "1998", "Type": "Research University", "Ranking": "7", "Deadline to Apply": "22 Jul 2026", "Tuition Range": "PKR 120,000 - 280,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Physics", "Mathematics", "Chemistry", "Bioinformatics"], "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Data Science"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "hec_scholarships": "HEC funded scholarships available"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 8. University of Karachi
(
  'University of Karachi',
  'The University of Karachi is one of the largest universities in Pakistan by enrollment, offering diverse programs in arts, science, commerce, law, and medicine.',
  'https://uok.edu.pk',
  'https://uok.edu.pk/admissions',
  true,
  '{"Location": "Karachi", "Sector": "Public", "Established": "1951", "Type": "Comprehensive University", "Ranking": "8", "Deadline to Apply": "30 Jul 2026", "Tuition Range": "PKR 30,000 - 100,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Statistics", "Economics", "Political Science", "Psychology", "English", "Urdu", "Commerce", "Law", "Medicine", "Pharmacy"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "hec_scholarships": "HEC and Sindh government scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 9. NED University
(
  'NED University of Engineering & Technology',
  'NED University is a premier engineering institution in Karachi, known for producing skilled engineers who serve Pakistan\'s industrial sector.',
  'https://neduet.edu.pk',
  'https://neduet.edu.pk/admissions',
  true,
  '{"Location": "Karachi", "Sector": "Public", "Established": "1921", "Type": "Engineering University", "Ranking": "9", "Deadline to Apply": "15 Jul 2026", "Tuition Range": "PKR 70,000 - 180,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Science & Engineering", "Software Engineering", "Industrial Engineering", "Metallurgy & Materials Engineering", "Petroleum Engineering", "Architecture"], "MSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science & Engineering"], "PhDPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "ned_scholarships": "NED merit and need-based scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": true}'::jsonb
),

-- 10. GIKI
(
  'Ghulam Ishaq Khan Institute of Engineering Sciences & Technology',
  'GIKI is a private engineering institute in Swabi, KPK, known for its rigorous academic standards and beautiful campus in the hills.',
  'https://giki.edu.pk',
  'https://giki.edu.pk/admissions',
  true,
  '{"Location": "Swabi", "Sector": "Private", "Established": "1993", "Type": "Engineering University", "Ranking": "10", "Deadline to Apply": "20 Jul 2026", "Tuition Range": "PKR 300,000 - 500,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science & Engineering", "Management Sciences"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "giki_scholarships": "GIKI merit, need-based, and HEC scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "mountain_campus": true}'::jsonb
),

-- 11. Quaid-i-Azam University
(
  'Quaid-i-Azam University (QAU)',
  'QAU is a top-ranked public research university in Islamabad, known for its strong programs in natural sciences, social sciences, and international relations.',
  'https://qau.edu.pk',
  'https://qau.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "1967", "Type": "Research University", "Ranking": "11", "Deadline to Apply": "25 Jul 2026", "Tuition Range": "PKR 40,000 - 120,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Statistics", "Economics", "Political Science", "International Relations", "Psychology", "Sociology", "English", "Urdu", "Biology", "Geology", "Environmental Sciences"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "International Relations"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "hec_scholarships": "HEC and university scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 12. Aga Khan University
(
  'Aga Khan University (AKU)',
  'AKU is a private research university in Karachi, internationally recognized for its medical school, nursing programs, and Institute for Educational Development.',
  'https://www.aku.edu',
  'https://www.aku.edu/admissions',
  true,
  '{"Location": "Karachi", "Sector": "Private", "Established": "1983", "Type": "Research University", "Ranking": "12", "Deadline to Apply": "30 Jun 2026", "Tuition Range": "PKR 800,000 - 1,500,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Medicine", "Nursing"], "MSPrograms": ["Biomedical Sciences", "Epidemiology & Biostatistics", "Health Policy & Management", "Education"], "PhDPrograms": ["Biomedical Sciences"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "aku_financial_aid": "Comprehensive financial aid covering up to 100% of demonstrated need"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "hospital": true}'::jsonb
),

-- 13. University of Peshawar
(
  'University of Peshawar',
  'The University of Peshawar is the oldest general university in Khyber Pakhtunkhwa, offering programs in arts, sciences, engineering, and law.',
  'https://www.uop.edu.pk',
  'https://www.uop.edu.pk/admissions',
  true,
  '{"Location": "Peshawar", "Sector": "Public", "Established": "1950", "Type": "Comprehensive University", "Ranking": "13", "Deadline to Apply": "28 Jul 2026", "Tuition Range": "PKR 30,000 - 90,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "English", "Urdu", "Journalism", "Law"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Economics"], "PhDPrograms": ["Physics", "Chemistry"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "kp_scholarships": "KP government and HEC scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true}'::jsonb
),

-- 14. Bahria University
(
  'Bahria University',
  'Bahria University is a public sector university sponsored by the Pakistan Navy, with campuses in Islamabad, Lahore, and Karachi.',
  'https://bahria.edu.pk',
  'https://bahria.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "2000", "Type": "Comprehensive University", "Ranking": "14", "Deadline to Apply": "20 Jul 2026", "Tuition Range": "PKR 150,000 - 300,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering", "Civil Engineering", "Management Sciences", "Psychology", "Media Studies"], "MSPrograms": ["Computer Science", "Software Engineering", "Management Sciences"], "PhDPrograms": ["Computer Science"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "navy_scholarships": "Navy and HEC scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": true}'::jsonb
),

-- 15. IIUI
(
  'International Islamic University Islamabad (IIUI)',
  'IIUI is a public university offering programs in both modern sciences and Islamic studies, with a strong focus on research and international collaboration.',
  'https://www.iiui.edu.pk',
  'https://www.iiui.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "1980", "Type": "Comprehensive University", "Ranking": "15", "Deadline to Apply": "22 Jul 2026", "Tuition Range": "PKR 50,000 - 150,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Islamic Studies", "Arabic", "Economics", "Management Sciences", "Psychology", "Education"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Islamic Studies", "Economics"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Islamic Studies"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "icrf_scholarships": "Islamic Cooperation Research Fund scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "mosque": true}'::jsonb
),

-- 16. SZABIST
(
  'Shaheed Zulfikar Ali Bhutto Institute of Science & Technology (SZABIST)',
  'SZABIST is a private university in Karachi offering programs in computer science, management, media sciences, and law, with campuses across Pakistan.',
  'https://szabist.edu.pk',
  'https://szabist.edu.pk/admissions',
  true,
  '{"Location": "Karachi", "Sector": "Private", "Established": "1995", "Type": "Research University", "Ranking": "16", "Deadline to Apply": "25 Jul 2026", "Tuition Range": "PKR 200,000 - 350,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Sciences", "Law", "Social Sciences"], "MSPrograms": ["Computer Science", "Business Administration", "Media Sciences"], "PhDPrograms": ["Computer Science"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "szabist_scholarships": "SZABIST merit and need-based scholarships"}'::jsonb,
  '{"hostel": false, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": false}'::jsonb
),

-- 17. Air University
(
  'Air University Islamabad',
  'Air University is a public research university established by the Pakistan Air Force, known for its engineering and management programs.',
  'https://www.air.edu.pk',
  'https://www.air.edu.pk/admissions',
  true,
  '{"Location": "Islamabad", "Sector": "Public", "Established": "2002", "Type": "Research University", "Ranking": "17", "Deadline to Apply": "18 Jul 2026", "Tuition Range": "PKR 120,000 - 250,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Avionics Engineering", "Aerospace Engineering", "Management Sciences"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Management Sciences"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "paf_scholarships": "PAF and HEC scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "transport": true}'::jsonb
),

-- 18.VIRTUAL University
(
  'Virtual University of Pakistan',
  'Virtual University is a public university focused on distance and online education, making quality education accessible across Pakistan.',
  'https://www.vu.edu.pk',
  'https://www.vu.edu.pk/admissions',
  true,
  '{"Location": "Lahore", "Sector": "Public", "Established": "2002", "Type": "Distance Learning University", "Ranking": "18", "Deadline to Apply": "31 Jul 2026", "Tuition Range": "PKR 20,000 - 60,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration", "Commerce", "Banking & Finance", "Media Studies", "Psychology", "Education"], "MSPrograms": ["Computer Science", "Business Administration"], "PhDPrograms": ["Computer Science"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "vu_scholarships": "Virtual University scholarships"}'::jsonb,
  '{"hostel": false, "library": true, "lab": false, "sports": false, "wifi": true, "cafeteria": false, "medical": false}'::jsonb
),

-- 19. Dow University
(
  'Dow University of Health Sciences (DUHS)',
  'DUHS is a leading health sciences university in Karachi, comprising Dow Medical College, Dow International Medical College, and multiple hospitals.',
  'https://www.duhs.edu.pk',
  'https://www.duhs.edu.pk/admissions',
  true,
  '{"Location": "Karachi", "Sector": "Public", "Established": "2003", "Type": "Health Sciences University", "Ranking": "19", "Deadline to Apply": "15 Jul 2026", "Tuition Range": "PKR 200,000 - 500,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Medicine", "Dentistry", "Pharmacy", "Nursing", "Public Health", "Physical Therapy", "Biomedical Engineering"], "MSPrograms": ["Public Health", "Pharmacology", "Pathology"], "PhDPrograms": ["Pharmacology", "Pathology"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "duhs_scholarships": "DUHS and Sindh government scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "hospital": true}'::jsonb
),

-- 20. UAF
(
  'University of Agriculture Faisalabad',
  'UAF is Pakistan\'s largest agricultural university, offering programs in agriculture, veterinary sciences, food sciences, and engineering.',
  'https://www.uaf.edu.pk',
  'https://www.uaf.edu.pk/admissions',
  true,
  '{"Location": "Faisalabad", "Sector": "Public", "Established": "1906", "Type": "Agricultural University", "Ranking": "20", "Deadline to Apply": "20 Jul 2026", "Tuition Range": "PKR 40,000 - 120,000 per semester"}'::jsonb,
  '{"BSPrograms": ["Agriculture", "Food Science & Technology", "Veterinary Science", "Biochemistry", "Microbiology", "Computer Science", "Electrical Engineering", "Civil Engineering", "Chemistry"], "MSPrograms": ["Agriculture", "Food Science", "Veterinary Science", "Biochemistry"], "PhDPrograms": ["Agriculture", "Food Science", "Veterinary Science"]}'::jsonb,
  '{"merit_based": true, "need_based": true, "hec_scholarships": "HEC and agriculture ministry scholarships"}'::jsonb,
  '{"hostel": true, "library": true, "lab": true, "sports": true, "wifi": true, "cafeteria": true, "medical": true, "agricultural_farms": true}'::jsonb
);
