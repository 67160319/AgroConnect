AgroConnect Frontend v5.1 — วิธีเผยแพร่ด้วย GitHub Pages

สิ่งที่เพิ่มในเวอร์ชันนี้
- หน้าลงสินค้าให้ผู้ขายเลือกภาพสินค้า กรอกชื่อ ราคา หน่วย และจังหวัดเอง
- ย่อภาพเป็น JPEG ก่อนบันทึก เพื่อลดการใช้พื้นที่ localStorage
- แสดงรูปที่อัปโหลดบนการ์ดสินค้าและส่วนปักสินค้าในไลฟ์
- คงดีไซน์และโครงหน้าเดิมจากเวอร์ชัน Review v5
- มีปุ่มเริ่ม/หยุดไลฟ์และปักสินค้าที่หน้า go-live.html

ข้อจำกัดสำคัญ
- เป็น Frontend Demo: สินค้า/ตะกร้า/บัญชีเก็บใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่ได้แชร์ข้ามผู้ใช้หรืออุปกรณ์
- ไลฟ์ทดสอบผ่าน PeerJS/WebRTC ต้องใช้ HTTPS (GitHub Pages ใช้ HTTPS ได้) และอนุญาตกล้อง/ไมค์ ผู้ชมต้องใช้รหัสไลฟ์จากผู้ขาย
- GitHub Pages ไม่ใช่ backend และไม่เก็บข้อมูลส่วนกลาง
- QR ชำระเงินเป็นเดโม อย่าใช้ยืนยันการจ่ายเงินจริง

วิธีลง GitHub Pages
1. แตก ZIP นี้ลงในเครื่อง
2. เปิดโฟลเดอร์ AgroConnect_Frontend_Updated_Improved_v5_1 แล้วตรวจว่ามี index.html อยู่ในโฟลเดอร์เดียวกับ script.js และ style.css
3. เปิด https://github.com/67160319/AgroConnect
4. กด Add file > Upload files
5. อัปโหลดไฟล์และโฟลเดอร์ภายใน AgroConnect_Frontend_Updated_Improved_v5_1 ไปที่ root ของ repository (อย่าอัปโหลดโฟลเดอร์ชั้นนอกเพิ่มอีกชั้น)
6. หากมีไฟล์เดิม ให้แทนที่ไฟล์เดิมด้วยเวอร์ชันนี้ แล้วกด Commit changes
7. ไป Settings > Pages
8. ใน Build and deployment เลือก Deploy from a branch; Branch: main; Folder: /(root); กด Save
9. รอให้สถานะ Deploy สำเร็จ แล้วเปิด https://67160319.github.io/AgroConnect/
10. ทดสอบหน้า Live ที่ https://67160319.github.io/AgroConnect/live.html และเพิ่มสินค้าที่ https://67160319.github.io/AgroConnect/add-product.html

การทดสอบลงสินค้า
1. เข้าสู่ระบบ Demo: npc_customer / AgroDemo2026!
2. ไป บัญชีของฉัน > เพิ่มสินค้า
3. เลือกรูป กรอกชื่อ ราคา หน่วย และจังหวัด แล้วกดลงขาย
4. กลับหน้าแรกเพื่อตรวจการ์ดสินค้า
5. ไป Live > เริ่มไลฟ์ แล้วเลือกสินค้าในรายการและกดปักสินค้า
