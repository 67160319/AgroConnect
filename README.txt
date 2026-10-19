AgroConnect Frontend Updated — Improved Old UX/UI

สิ่งที่ปรับ:
- ยึดโครงหน้าเดิม: แถบภาษา > Navbar เขียว > Hero/Search > ราคาตลาด > หมวดหมู่ > สินค้า > Live > บริการ > Tracking > Contact > Footer
- โทนสี/บรรยากาศใกล้หน้าเดิมที่ผู้ใช้ส่งมา
- แก้รูปแตก: รูปสินค้ามี remote photo + local fallback
- Live มีเฉพาะห้อง Live ของเจ้าของบัญชี: เริ่ม/หยุดไลฟ์ + เลือก/ปักตะกร้า ไม่สร้าง Avatar NPC
- Payment ใช้ assets/payment-qr.jpg ที่ผู้ใช้ให้มาเท่านั้น
- Tracking: Tracking ID, timeline, route และอัปเดตสถานะ
- Cart/Payment/Order/Tracking เชื่อมต่อกันด้วย localStorage
- Login/Register เป็น Demo frontend; ยังไม่แตะ FastAPI/Docker

บัญชี Demo:
Username: npc_customer
Password: AgroDemo2026!

แนะนำ: เปิด index.html ด้วย VS Code + Live Server เพื่อทดสอบกล้องในหน้า Live


ปรับปรุงตามข้อเสนอผู้ใช้:
- เอาแถบเลือกภาษาออก
- เอาลิงก์ “สินค้า” จาก Navbar ออก แต่คงหมวดหมู่ไว้ในหน้าแรก
- เอาบล็อกราคาสินค้าเกษตรวันนี้ออก เพื่อให้ผู้ขายตั้งราคาเองก่อน
- เอาบล็อก Live Shopping โปรโมตออกจากหน้าแรก และใช้เมนู Live เป็นทางเข้า
- เพิ่มไอคอนแจ้งเตือนและแชทใกล้ตะกร้า พร้อมหน้า placeholder ของแต่ละส่วน
- live.html เป็นหน้ารวมไลฟ์ มีข้อความเมื่อไม่มีไลฟ์และปุ่ม + เริ่มไลฟ์ด้านขวา
- go-live.html เป็นหน้าทดสอบเปิดกล้อง/ไมค์และปักสินค้า
- การเข้าสู่หน้าเริ่มไลฟ์ต้องเข้าสู่ระบบ Demo ก่อน

ข้อจำกัดสำคัญ: กล้องใน go-live.html เป็นเพียง local preview; ยังไม่ใช่การถ่ายทอดสดไปยังผู้ชมคนอื่น และสถานะที่เก็บใน localStorage มองเห็นได้เฉพาะเบราว์เซอร์/เครื่องเดียวกัน. การไลฟ์จริงหลายอุปกรณ์ต้องเชื่อม LiveKit (หรือผู้ให้บริการสตรีมอื่น) และ FastAPI ออก Token ให้ผู้ใช้. Login/Register ในชุดนี้ยังเป็น Demo Frontend ไม่ใช่ระบบยืนยันตัวตน Production.


=== v3 updates ===
- Tracking status is displayed horizontally; the map panel is removed.
- Added account.html profile page, optional profile photo, product listings, and seller QR-code storage.
- Registration now includes gender and date of birth in Gregorian (AD) format.
- Added machinery.html for machinery/service requests.
- New listing/profile/QR data are stored in browser localStorage for demo only. They are not synchronized across devices and are not stored in FastAPI/SQLite yet.
- Use small image files to avoid browser localStorage quota limits. Never treat the QR demo as payment verification.

=== Final review build ===
- Product cards/details/cart no longer show product photos; listing forms no longer require a product photo.
- Brand icon is 🌱 without a white circular background.
- Account logout is inside the same profile block; profile photo upload remains available.
- Added add-product.html so the account page keeps the QR and product list while adding products on a separate page.
- Machinery page now accepts service-provider listings and service pricing, rather than requests seeking a provider.
- Added warehouse.html so warehouse owners can publish location, capacity, availability, details, and an optional photo.
- Added a PeerJS/WebRTC live test flow: seller opens go-live.html and starts camera/microphone; viewers enter the seller's displayed live ID at live.html#watch. Multiple viewers can call the broadcaster.

IMPORTANT LIMITS BEFORE UNIVERSITY SERVER DEPLOYMENT:
- This bundle stores listings, profile photos, QR, warehouse listings, cart and demo login state in browser localStorage. Data is not shared across users/devices and is not production database persistence.
- Live test uses the public PeerJS cloud signaling service and a CDN-hosted PeerJS library. It requires internet access, HTTPS (or localhost), camera/microphone permission, and network/NAT settings that allow WebRTC. This is a working prototype path, not a guarantee of production-grade reliability or scale. For a university production deployment, configure a university-managed signaling/media service (e.g. LiveKit or a secured WebRTC SFU), authentication/tokens, TURN, and a backend API.
- Live sessions are not automatically discoverable to other devices because the current frontend has no shared backend live-session registry. Share the live ID with viewers manually for this test build.
- Payment QR is Demo only; no payment provider verification is implemented.
- Login/register are still demo frontend and are not production authentication. Do not expose real user or payment information.
- Recommended test: run using VS Code Live Server/localhost or HTTPS, log in with npc_customer / AgroDemo2026!, test add-product, warehouse, machinery, profile photo, logout confirmation, and use two devices/browsers for live testing.
