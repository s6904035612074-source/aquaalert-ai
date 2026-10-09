# AquaAlert AI

เว็บเตือนน้ำท่วมกรุงเทพฯ: ประชาชนแจ้งเหตุพร้อมรูป ระบบประเมินความเสี่ยงเขียว เหลือง แดง ค้นหาเขตหรือสถานที่ได้ และให้ AI ประมาณระดับน้ำจากรูป

## ไฟล์ในโปรเจกต์
- `index.html` หน้าเว็บ
- `api/config.js` ส่งค่าเชื่อมต่อ Supabase ให้หน้าเว็บ
- `api/analyze.js` ให้ AI ดูรูปและประมาณระดับน้ำ
- `supabase.sql` คำสั่งสร้างตารางและที่เก็บรูป

## ขั้นตอนติดตั้ง

### 1. Supabase (ฐานข้อมูลและรูป)
1. สมัครที่ supabase.com แล้วกด New project
2. เข้าเมนู SQL Editor วางเนื้อหาไฟล์ `supabase.sql` ทั้งหมด แล้วกด Run
3. เข้า Project Settings > API คัดลอก Project URL และ anon public key เก็บไว้

### 2. Anthropic (AI ดูรูป ไม่บังคับ)
1. เข้า console.anthropic.com สร้าง API key แล้วคัดลอกเก็บไว้
2. ถ้าไม่ใส่ key เว็บยังใช้งานได้ปกติ แค่ไม่มีปุ่มให้ AI ประเมินรูป

### 3. GitHub
1. สร้าง repository ใหม่
2. อัปโหลดไฟล์ทั้งหมด โดยให้ `config.js` และ `analyze.js` อยู่ในโฟลเดอร์ `api`

### 4. Vercel
1. Add New > Project แล้วเลือก repository นี้
2. ก่อนกด Deploy เปิด Environment Variables แล้วใส่
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon public key
   - `ANTHROPIC_API_KEY` = API key จากข้อ 2
3. กด Deploy
4. ถ้าเพิ่มหรือแก้ Environment Variables ภายหลัง ต้อง Redeploy ใหม่

## เกณฑ์ความเสี่ยง
- เขียว: น้ำต่ำกว่า 10 ซม. และฝน 24 ชม. ไม่เกิน 35 มม.
- เหลือง: น้ำ 10–29 ซม. หรือฝน 35.1–90 มม.
- แดง: น้ำ 30 ซม. ขึ้นไป หรือฝนเกิน 90 มม. หรือน้ำระดับเหลืองพร้อมฝนหนัก
