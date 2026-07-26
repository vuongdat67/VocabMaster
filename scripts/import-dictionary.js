import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Lấy biến môi trường từ thư mục gốc
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Cần có VITE_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong file .env.local')
  console.error('Lưu ý: Bạn phải dùng SERVICE_ROLE_KEY để bypass RLS (Row Level Security) khi insert vào global_dictionary!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function importCSV() {
  const filePath = path.resolve('F:/eng/dic/English - Vietnamese.csv')
  console.log(`Đang đọc file: ${filePath}...`)
  
  const results = []
  
  fs.createReadStream(filePath)
    .pipe(csv(['english', 'vietnamese_analytics']))
    .on('data', (data) => {
      // Bỏ qua dòng header nếu có
      if (data.english === 'english' || !data.english) return
      
      const word = data.english.trim()
      let rawDef = data.vietnamese_analytics || ''
      
      // Xử lý dữ liệu thô:
      // Trong file CSV này, cấu trúc thường là: danh tu`|- (vt cu?a parachutist)...
      // Ta sẽ lọc và tách ra thành mảng definitions
      
      const parts = rawDef.split('|-')
      const posRaw = parts[0].trim() // Part of speech, vd: "danh tu`", "dong tu`"
      let pos = 'unknown'
      if (posRaw.includes('danh tu')) pos = 'noun'
      else if (posRaw.includes('dong tu') || posRaw.includes('d,')) pos = 'verb'
      else if (posRaw.includes('tinh tu')) pos = 'adjective'
      else if (posRaw.includes('trang tu')) pos = 'adverb'
      else if (posRaw.includes('gioi tu')) pos = 'preposition'
      
      const meanings = parts.slice(1).map(p => {
        let cleaned = p.replace(/\|/g, '').replace(/\+/g, '').replace(/=/g, '').trim()
        cleaned = cleaned.replace(/\\/g, '') // Sanitize backslashes which cause \u0000 postgres error
        cleaned = cleaned.replace(/\u0000/g, '')
        return {
          vietnamese: cleaned,
          meaning: '' 
        }
      }).filter(m => m.vietnamese.length > 0)
      
      if (meanings.length === 0) {
        let cleaned = rawDef.trim().replace(/\\/g, '').replace(/\u0000/g, '')
        meanings.push({ vietnamese: cleaned, meaning: '' })
      }
      
      results.push({
        word: word.replace(/\\/g, '').replace(/\u0000/g, ''),
        part_of_speech: pos,
        definitions: meanings,
        ipa: '',
      })
    })
    .on('end', async () => {
      console.log(`✅ Đã parse xong ${results.length} từ vựng từ CSV. Bắt đầu upload...`)
      
      // Chia thành các chunk 1000 item để insert
      const CHUNK_SIZE = 1000
      let successCount = 0
      
      for (let i = 0; i < results.length; i += CHUNK_SIZE) {
        const chunk = results.slice(i, i + CHUNK_SIZE)
        console.log(`Đang đẩy chunk ${Math.floor(i/CHUNK_SIZE) + 1} / ${Math.ceil(results.length/CHUNK_SIZE)}...`)
        
        const { error } = await supabase
          .from('global_dictionary')
          .insert(chunk)
          
        if (error) {
          console.error(`❌ Lỗi ở chunk ${i}:`, error.message)
        } else {
          successCount += chunk.length
        }
      }
      
      console.log(`\n🎉 Hoàn thành! Đã upload thành công ${successCount} / ${results.length} từ.`)
    })
}

importCSV()
