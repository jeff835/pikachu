import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOldIds() {
  console.log('🧹 開始清理舊版未帶 Region 後綴的卡片資料...');
  
  // 要刪除不包含 '-JP'、'-TW'、'-US' 結尾的卡片
  // 利用 SQL / PostgREST 的不包含語法來過濾
  const { data, error } = await supabase
    .from('cards')
    .select('id, name');
    
  if (error) {
    console.error('獲取清單失敗:', error);
    return;
  }
  
  const oldCards = data.filter(c => !c.id.includes('-JP') && !c.id.includes('-TW') && !c.id.includes('-US'));
  console.log(`發現 ${oldCards.length} 筆舊版資料需要刪除。`);
  
  if (oldCards.length === 0) {
    console.log('沒有需要刪除的資料，系統乾淨！');
    return;
  }

  // 分批刪除
  const batchSize = 500;
  for (let i = 0; i < oldCards.length; i += batchSize) {
    const batch = oldCards.slice(i, i + batchSize).map(c => c.id);
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .in('id', batch);
      
    if (deleteError) {
      console.error(`刪除第 ${i/batchSize + 1} 批次失敗:`, deleteError);
    } else {
      console.log(`✅ 成功刪除批次 ${i/batchSize + 1}`);
    }
  }
  
  console.log('🎉 舊資料清理完成！網站上的卡池應該已更新為全新帶後綴版本。');
}

cleanupOldIds().catch(console.error);
