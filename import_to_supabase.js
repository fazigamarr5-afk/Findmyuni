const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://luribqlhnmgslpoqlxmi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY env var');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Load university data from Excel conversion
  const data = JSON.parse(fs.readFileSync('supabase/universities_from_excel.json', 'utf8'));
  console.log('Loaded ' + data.length + ' universities from Excel data');

  let inserted = 0, updated = 0, errors = 0;

  // Process in batches of 10 to avoid rate limits
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    for (const uni of batch) {
      try {
        // Check if university already exists
        const { data: existing } = await supabase
          .from('universities')
          .select('id')
          .eq('name', uni.name)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing
          const { error } = await supabase
            .from('universities')
            .update({
              description: uni.description || '',
              url: uni.url || '',
              apply_link: uni.apply_link || '',
              admission_open: uni.admission_open ?? true,
              basic_info: uni.basic_info || {},
              programs: uni.programs || {},
              scholarships: uni.scholarships || {},
              facilities: uni.facilities || {},
            })
            .eq('id', existing[0].id);
          
          if (error) throw error;
          updated++;
        } else {
          // Insert new
          const { error } = await supabase
            .from('universities')
            .insert({
              name: uni.name,
              description: uni.description || '',
              url: uni.url || '',
              apply_link: uni.apply_link || '',
              admission_open: uni.admission_open ?? true,
              basic_info: uni.basic_info || {},
              programs: uni.programs || {},
              scholarships: uni.scholarships || {},
              facilities: uni.facilities || {},
            });
          
          if (error) throw error;
          inserted++;
        }

        if ((inserted + updated) % 50 === 0) {
          console.log('Progress: ' + inserted + ' inserted, ' + updated + ' updated, ' + errors + ' errors');
        }
      } catch (e) {
        console.error('Error with ' + uni.name + ': ' + e.message);
        errors++;
      }
    }
    
    // Small delay between batches
    if (i + BATCH_SIZE < data.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\n=== IMPORT COMPLETE ===');
  console.log('Inserted: ' + inserted);
  console.log('Updated: ' + updated);
  console.log('Errors: ' + errors);
  console.log('Total: ' + (inserted + updated + errors));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
