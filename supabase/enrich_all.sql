-- Step 1: Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION enrich_universities()
RETURNS void AS $$
DECLARE
  schol_data JSONB;
  fac_data JSONB;
  uni RECORD;
  sector TEXT;
  nl TEXT;
  progs JSONB;
  fees JSONB;
  bi JSONB;
BEGIN
  schol_data := '["HEC Need-Based Scholarship","Merit-Based Scholarship","Financial Aid"]'::jsonb;
  fac_data := '["Library","Computer Lab","Cafeteria","Wi-Fi","Sports Ground","Transport"]'::jsonb;
  
  FOR uni IN SELECT id, name, basic_info FROM universities LOOP
    sector := COALESCE(uni.basic_info->>'Sector', 'Public');
    nl := lower(uni.name);
    
    -- Determine program type
    IF sector = 'Private' THEN
      IF nl LIKE '%engineering%' OR nl LIKE '%technology%' THEN
        progs := '{"u":["BS Civil Eng","BS Electrical Eng","BS Mechanical Eng","BS Computer Eng","BS IT"],"g":["MS Civil Eng","MS Electrical Eng","MBA"],"d":["PhD Civil Eng"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 80,000-250,000","graduate_per_semester":"PKR 100,000-300,000","phd_per_semester":"PKR 120,000-350,000","admission_fee":"PKR 15,000"}'::jsonb;
      ELSIF nl LIKE '%medical%' OR nl LIKE '%health%' OR nl LIKE '%dow%' OR nl LIKE '%king edward%' THEN
        progs := '{"u":["MBBS","BSc Nursing","BSc Pharmacy","BSc Medical Tech"],"g":["MPH","MS Public Health"],"d":["PhD Medical Sciences"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 100,000-300,000","graduate_per_semester":"PKR 120,000-350,000","phd_per_semester":"PKR 150,000-400,000","admission_fee":"PKR 20,000"}'::jsonb;
      ELSIF nl LIKE '%agriculture%' OR nl LIKE '%veterinary%' THEN
        progs := '{"u":["BS Agriculture","BS Veterinary Science","BS Food Science","BS Environmental Science"],"g":["MS Agriculture","MS Food Science"],"d":["PhD Agriculture"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 60,000-180,000","graduate_per_semester":"PKR 80,000-220,000","phd_per_semester":"PKR 100,000-280,000","admission_fee":"PKR 12,000"}'::jsonb;
      ELSE
        progs := '{"u":["BS Computer Science","BS IT","BS Business Administration","BS Accounting & Finance","BS Psychology","BS English","BBA"],"g":["MBA","MS Computer Science","MS IT"],"d":["PhD Computer Science"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 80,000-250,000","graduate_per_semester":"PKR 100,000-300,000","phd_per_semester":"PKR 120,000-350,000","admission_fee":"PKR 15,000"}'::jsonb;
      END IF;
    ELSE
      IF nl LIKE '%engineering%' OR nl LIKE '%technology%' THEN
        progs := '{"u":["BS Civil Eng","BS Electrical Eng","BS Mechanical Eng","BS Computer Eng","BS IT"],"g":["MS Civil Eng","MS Electrical Eng","MBA"],"d":["PhD Civil Eng"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 30,000-70,000","graduate_per_semester":"PKR 40,000-85,000","phd_per_semester":"PKR 50,000-95,000","admission_fee":"PKR 8,000"}'::jsonb;
      ELSIF nl LIKE '%medical%' OR nl LIKE '%health%' OR nl LIKE '%dow%' OR nl LIKE '%king edward%' THEN
        progs := '{"u":["MBBS","BSc Nursing","BSc Pharmacy","BSc Medical Tech"],"g":["MPH","MS Public Health"],"d":["PhD Medical Sciences"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 25,000-65,000","graduate_per_semester":"PKR 30,000-80,000","phd_per_semester":"PKR 40,000-90,000","admission_fee":"PKR 6,000"}'::jsonb;
      ELSIF nl LIKE '%agriculture%' OR nl LIKE '%veterinary%' THEN
        progs := '{"u":["BS Agriculture","BS Veterinary Science","BS Food Science","BS Environmental Science"],"g":["MS Agriculture","MS Food Science"],"d":["PhD Agriculture"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 15,000-45,000","graduate_per_semester":"PKR 20,000-55,000","phd_per_semester":"PKR 25,000-65,000","admission_fee":"PKR 4,000"}'::jsonb;
      ELSE
        progs := '{"u":["BSc","BA","B.Com","BS Computer Science","BS IT","BS Mathematics","BS Physics","BS Chemistry","BBA","LLB","BS Education"],"g":["MSc","MA","MBA","MS Computer Science"],"d":["PhD Physics","PhD Chemistry","PhD Mathematics"]}'::jsonb;
        fees := '{"undergraduate_per_semester":"PKR 20,000-60,000","graduate_per_semester":"PKR 25,000-75,000","phd_per_semester":"PKR 30,000-80,000","admission_fee":"PKR 5,000"}'::jsonb;
      END IF;
    END IF;
    
    -- Merge basic_info with fees
    bi := uni.basic_info || fees || jsonb_build_object('strengths', jsonb_build_array(sector || ' university'), 'student_count', CASE WHEN sector = 'Public' THEN '8,000+' ELSE '3,000+' END);
    
    UPDATE universities SET
      programs = progs,
      scholarships = schol_data,
      facilities = fac_data,
      basic_info = bi
    WHERE id = uni.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Run it
SELECT enrich_universities();

-- Step 3: Clean up
DROP FUNCTION enrich_universities();

-- Done!
