AgroConnect — เวอร์ชันเชื่อม API (ต้องตั้งค่าเซิร์ฟเวอร์ก่อนเปิดให้คนจริงใช้)

มีอะไรที่เชื่อมเซิร์ฟเวอร์แล้ว
- สมัครสมาชิกและเข้าสู่ระบบผ่าน API; รหัสผ่านถูกแฮชด้วย PBKDF2 และเซสชันใช้ token
- ลงสินค้า/รูป/ราคาและดึงรายการสินค้าจากฐานข้อมูล SQLite กลาง ให้ผู้ใช้ที่เชื่อม API เดียวกันเห็นร่วมกัน
- มี Dockerfile และ docker-compose สำหรับรัน API

วิธีทดสอบในเครื่อง
1) ติดตั้ง Docker Desktop แล้วเปิด Docker
2) เปิด Terminal ในโฟลเดอร์ backend
3) รัน: docker compose up --build -d
4) เปิด http://localhost:8000/docs ตรวจว่า API ทำงาน
5) แก้ api-integration.js ค่า AGRO_API_BASE ให้เป็น URL API จริงเมื่อ deploy (เช่น https://api.your-domain.example)
6) เปิดเว็บผ่าน local server/HTTPS ไม่แนะนำเปิดไฟล์ file://

ก่อนเปิดให้คนทั่วไปใช้จริง ต้องทำต่อ
- ตั้ง AGRO_CORS_ORIGINS ให้เป็นโดเมนหน้าเว็บที่อนุญาต แทน *; ใช้ HTTPS ทั้งเว็บและ API
- ตั้งค่า reverse proxy/rate limit, สำรองฐานข้อมูล, จำกัดขนาดรูป/เก็บรูปใน object storage และตั้งนโยบาย privacy/PDPA
- ระบบสั่งซื้อ/ชำระเงินจริง/คืนเงิน/ขนส่ง/แชท/แจ้งเตือน/คลัง/เครื่องจักรยังเป็นต้นแบบในหน้าเว็บ ไม่ควรใช้ทำธุรกรรมจริง
- Live ใช้ PeerJS เป็นต้นแบบ; ยังไม่ได้รับประกันการเชื่อมต่อทุกเครือข่าย และการปักตะกร้าระหว่างผู้ขายกับผู้ชมยังไม่ซิงก์ผ่าน API นี้ ต้องทดสอบและพัฒนาต่อ
- เพิ่มการยืนยันอีเมล, rate limiting, token expiry/revocation policy, logging, monitoring และทดสอบความปลอดภัยก่อน production

สำคัญ: แพ็กเกจนี้เป็นชุดพัฒนาสำหรับนำไป deploy/test ต่อ ไม่ใช่บริการออนไลน์ที่ deploy ให้แล้ว และยังไม่ควรรับชำระเงินจริงจนกว่าระบบคำสั่งซื้อ/ชำระเงินจะพัฒนาเสร็จ


=== แก้ปัญหา API / PDPA (ฉบับปรับปรุง) ===

1) ทดสอบ API ในเครื่อง
- เปิด Docker Desktop ให้พร้อมใช้งาน
- เปิด Terminal ในโฟลเดอร์ backend ซึ่งมี docker-compose.yml
- รัน: docker compose up --build -d
- รัน: docker compose ps
- เปิด http://localhost:8000/health ต้องเห็น {"status":"ok"}
- เปิด http://localhost:8000/docs เพื่อตรวจ endpoint

2) GitHub Pages ไม่สามารถเรียก localhost ของคอมผู้พัฒนาได้
- ต้อง deploy backend ไป Web Service ที่รองรับ FastAPI เช่น Render
- ตั้ง Root Directory เป็น backend
- Build Command: pip install -r requirements.txt
- Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
- ตั้ง Environment Variable AGRO_CORS_ORIGINS=https://67160319.github.io
- เมื่อ deploy สำเร็จ คัดลอก URL HTTPS จริงของ API แล้วแก้บรรทัด AGRO_API_BASE ใน api-integration.js ให้เป็น URL นั้น (ห้ามเติม /api ต่อท้าย)
- Commit/push ไฟล์ api-integration.js ขึ้น GitHub แล้วทดสอบหน้า Login/Register อีกครั้ง
- บริการฟรีอาจพักเมื่อไม่มีการใช้งาน และ SQLite บนพื้นที่ดิสก์ชั่วคราวอาจสูญหายเมื่อรีสตาร์ต/ดีพลอยใหม่ ห้ามใช้เก็บข้อมูลจริงระยะยาวโดยไม่มี persistent database/disk

3) PDPA
- หน้า register.html บังคับติ๊ก privacyConsent และส่งค่าสู่ API
- backend ตรวจซ้ำและบันทึก privacy_consent, privacy_notice_version และ privacy_consent_at ในฐานข้อมูล
- privacy.html เป็นร่างประกาศความเป็นส่วนตัว ต้องเติมช่องทางติดต่อจริง กำหนดระยะเวลาเก็บข้อมูลและตรวจฐานกฎหมายก่อนใช้งานจริง
- การบังคับให้ยินยอมเพื่อสร้างบัญชีอาจไม่เหมาะในทุกกรณี หากการประมวลผลบางอย่างจำเป็นต่อสัญญาควรพิจารณาฐานกฎหมายให้เหมาะสมและแยกความยินยอมที่ไม่จำเป็น เช่น การตลาด ออกจากการสมัครบัญชี
