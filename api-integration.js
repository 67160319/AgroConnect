/* AgroConnect server-backed account and product listing. Set API_BASE to your HTTPS API URL before deployment. */
// LOCAL TEST: http://localhost:8000. For GitHub Pages, replace with the real HTTPS URL from your deployed API host.
window.AGRO_API_BASE = window.AGRO_API_BASE || 'http://localhost:8000';
const AGRO_API = () => String(window.AGRO_API_BASE || '').replace(/\/$/, '');
async function agroRequest(path, options={}) {
  const headers = {'Content-Type':'application/json', ...(options.headers||{})};
  const token = localStorage.getItem('agroApiToken');
  if(token) headers.Authorization = 'Bearer ' + token;
  let response;
  try { response = await fetch(AGRO_API()+path, {...options, headers}); }
  catch(e) { throw new Error('ติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจ API URL และอินเทอร์เน็ต'); }
  const body = await response.json().catch(()=>({detail:'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง'}));
  if(!response.ok) throw new Error(body.detail || body.message || 'ทำรายการไม่สำเร็จ');
  return body;
}
function agroApiMessage(msg){ const e=document.getElementById('registerMsg')||document.getElementById('loginMsg'); if(e){e.textContent=msg;e.style.color='#b42318';} else if(typeof toast==='function') toast(msg); else alert(msg); }
async function loginDemo(){
  const username=document.getElementById('username')?.value.trim()||'', password=document.getElementById('password')?.value||'';
  try { const data=await agroRequest('/api/login',{method:'POST',body:JSON.stringify({username,password})});
    localStorage.setItem('agroApiToken',data.token); localStorage.setItem('agroUser',data.user.username);
    const users=JSON.parse(localStorage.getItem('agroUsers')||'{}'); users[data.user.username]={...data.user,password:''}; localStorage.setItem('agroUsers',JSON.stringify(users));
    location.href=new URLSearchParams(location.search).get('next')||'index.html';
  } catch(e){agroApiMessage(e.message);}
}
async function registerDemo(event){
  event?.preventDefault(); const form=document.getElementById('registerForm'); if(!form)return;
  const consent=form.querySelector('[name=privacyConsent]');
  const button=document.getElementById('registerButton');
  const data={fullname:form.fullname.value.trim(),username:form.username.value.trim(),email:form.email.value.trim(),password:form.password.value,gender:form.gender?.value||null,birthDate:form.birthDate?.value||null,privacyConsent:!!consent?.checked};
  if(data.password.length<10){agroApiMessage('รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษรเพื่อความปลอดภัย');return;}
  if(!data.privacyConsent){agroApiMessage('กรุณาอ่านประกาศความเป็นส่วนตัวและติ๊กยินยอมก่อนสมัครสมาชิก');consent?.focus();return;}
  if(button)button.disabled=true;
  try { await agroRequest('/api/register',{method:'POST',body:JSON.stringify(data)}); alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ'); location.href='login.html'; }
  catch(e){agroApiMessage(e.message);}
  finally {if(button)button.disabled=false;}
}
window.AGRO_SERVER_PRODUCTS = window.AGRO_SERVER_PRODUCTS || [];
async function agroServerProducts(){
  try { window.AGRO_SERVER_PRODUCTS = await agroRequest('/api/products'); return window.AGRO_SERVER_PRODUCTS; }
  catch(e) { console.warn(e.message); return window.AGRO_SERVER_PRODUCTS || []; }
}
function addCart(id,qty=1){
  const p=[...PRODUCTS,...(window.AGRO_SERVER_PRODUCTS||[]),...allListings()].find(x=>x.id===id);
  if(!p){toast('ไม่พบสินค้า กรุณารีเฟรชหน้าแล้วลองใหม่');return;}
  const c=cart(),x=c.find(i=>i.id===id),amount=Math.max(1,Number(qty)||1);
  if(x)x.qty+=amount;else c.push({...p,qty:amount}); saveCart(c); toast('เพิ่มสินค้าในตะกร้าแล้ว');
}
async function searchProducts(){const q=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();const rows=[...PRODUCTS,...await agroServerProducts(),...allListings()].filter(p=>(p.name+' '+p.province+' '+p.seller+' '+p.category).toLowerCase().includes(q));await renderProducts(rows);document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}
async function filterCategory(q){const rows=[...PRODUCTS,...await agroServerProducts(),...allListings()].filter(p=>(p.name+' '+p.province+' '+p.category).includes(q));await renderProducts(rows);document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}

async function renderProducts(list=null){
  const el=document.getElementById('productsGrid'); if(!el)return;
  const server=await agroServerProducts(); const combined=[...PRODUCTS,...server,...allListings()];
  const chosen=list||combined; el.innerHTML=chosen.map(p=>`<article class="product">${imgTag(p)}<div class="product-body"><span class="tag">${escapeHTML(p.category||p.province||'สินค้าเกษตร')}</span><h3>${escapeHTML(p.name)}</h3><div class="seller">ขายโดย ${escapeHTML(p.seller||p.province||'สมาชิก AgroConnect')}</div><div class="product-row"><div><div class="price">฿${money(p.price)}</div><small class="muted">/ ${escapeHTML(p.unit)}</small></div><button class="btn btn-primary" onclick="addCart('${p.id}')">เพิ่มลงตะกร้า</button></div></div></article>`).join('')||'<div class="empty">ยังไม่มีสินค้า หรือเชื่อมต่อเซิร์ฟเวอร์ไม่ได้</div>';
}
async function submitListing(event){
  event.preventDefault(); if(!requireLogin('add-product.html'))return;
  const form=document.getElementById('listingForm'),data=new FormData(form),file=document.getElementById('listingPhoto')?.files?.[0];
  if(!file){toast('กรุณาเพิ่มรูปสินค้า');return;}
  try { const photoData=await compressListingPhoto(file); const payload={name:String(data.get('name')).trim(),category:String(data.get('category')),price:Number(data.get('price')),unit:String(data.get('unit')),province:String(data.get('province')).trim(),photoData};
    const result=await agroRequest('/api/products',{method:'POST',body:JSON.stringify(payload)}); form.reset(); toast('ลงขายสินค้าแล้ว เผยแพร่ให้ผู้ใช้ทุกคนเห็น'); if(location.pathname.endsWith('add-product.html'))location.href='account.html'; else await renderProducts();
  } catch(e){toast(e.message);}
}
async function renderMyProducts(){
  const el=document.getElementById('myProductsGrid'); if(!el)return; const server=await agroServerProducts(); const mine=server.filter(p=>p.seller===currentProfile().fullname||p.seller===currentUser());
  const local=allListings().filter(p=>p.owner===currentUser()); const rows=[...mine,...local];
  el.innerHTML=rows.map(p=>`<article class="product">${imgTag(p)}<div class="product-body"><h3>${escapeHTML(p.name)}</h3><p class="price">฿${money(p.price)} / ${escapeHTML(p.unit)}</p><button class="btn btn-outline" onclick="deleteListing('${p.id}')">ลบประกาศ</button></div></article>`).join('')||'<div class="empty">คุณยังไม่ได้ลงขายสินค้า</div>';
}
async function deleteListing(id){
  if(!confirm('ต้องการลบสินค้านี้หรือไม่?'))return;
  try { if(String(id).startsWith('agc-')) await agroRequest('/api/products/'+encodeURIComponent(id),{method:'DELETE'}); else localStorage.setItem('agroSellerListings',JSON.stringify(allListings().filter(p=>p.id!==id))); await renderMyProducts(); await renderProducts(); toast('ลบประกาศแล้ว'); }
  catch(e){toast(e.message);}
}

async function logoutDemo(){
  const token=localStorage.getItem('agroApiToken');
  try { if(token) await agroRequest('/api/logout',{method:'POST'}); } catch(e) { console.warn('Logout API:',e.message); }
  localStorage.removeItem('agroApiToken'); localStorage.removeItem('agroUser'); location.href='index.html';
}

async function renderDetail(){
 const el=document.getElementById('productDetail'); if(!el)return;
 const all=[...await agroServerProducts(),...allListings()];
 const id=new URLSearchParams(location.search).get('id'); const p=all.find(x=>x.id===id);
 if(!p){el.innerHTML='<div class="panel empty"><h2>เลือกสินค้าจากหน้า Marketplace</h2><p>สินค้าจริงจะแสดงเมื่อผู้ขายลงประกาศบนระบบ</p><a class="btn btn-primary" href="index.html#products">ไปเลือกสินค้า</a></div>';return;}
 el.innerHTML=`<div class="two-col"><div class="panel">${imgTag(p,'product-detail-img')}</div><div class="panel"><span class="tag">${escapeHTML(p.province||p.category)}</span><h1 class="page-title">${escapeHTML(p.name)}</h1><p class="muted">ขายโดย ${escapeHTML(p.seller||'สมาชิก AgroConnect')}</p><div class="price" style="font-size:30px">฿${money(p.price)} / ${escapeHTML(p.unit)}</div><div class="qty"><button onclick="changeQty(-1)">−</button><input id="qty" value="1" min="1" type="number"><button onclick="changeQty(1)">+</button></div><button class="btn btn-primary" onclick="addCart('${p.id}',Number(document.getElementById('qty').value)||1)">🛒 เพิ่มลงตะกร้า</button> <a class="btn btn-outline" href="cart.html">ไปตะกร้า</a></div></div>`;
}
async function renderPayment(){const el=document.getElementById('paymentArea');if(!el)return;el.innerHTML='<div class="panel"><span class="tag">ยังไม่เปิดรับเงินจริง</span><h1 class="page-title">ชำระเงิน</h1><p>ขั้นตอนชำระเงินจริงยังไม่เชื่อมกับผู้ให้บริการชำระเงิน ระบบจึงยังไม่รับหรือยืนยันการโอนเงิน</p><p class="muted">อย่าโอนเงินโดยใช้ QR ตัวอย่างในชุด Demo</p><a class="btn btn-primary" href="cart.html">กลับไปตรวจตะกร้า</a></div>';}
function confirmPayment(){toast('ระบบชำระเงินจริงยังไม่เปิดใช้งาน จึงยังไม่สร้างคำสั่งซื้อ');}
function renderTracking(){const el=document.getElementById('trackingArea');if(!el)return;el.innerHTML='<div class="panel"><h1 class="page-title">ติดตามสินค้า</h1><p>ระบบติดตามขนส่งจริงจะเปิดใช้หลังเชื่อมต่อระบบคำสั่งซื้อและผู้ให้บริการขนส่ง</p><p class="muted">สถานะที่แสดงในเวอร์ชัน Demo เป็นข้อมูลจำลองเท่านั้น</p><a class="btn btn-primary" href="index.html#products">กลับไปเลือกสินค้า</a></div>';}
function pinProduct(){const id=document.getElementById('pinSelect')?.value;const p=[...PRODUCTS,...(window.AGRO_SERVER_PRODUCTS||[]),...allListings()].find(x=>x.id===id);if(!p)return;const target=document.getElementById('pinnedProduct');if(target)target.innerHTML=`${imgTag(p,'')}<div><b>${escapeHTML(p.name)}</b><br><small>฿${money(p.price)} / ${escapeHTML(p.unit)}</small></div><button class="btn btn-primary" onclick="addCart('${p.id}')">🛒 เพิ่มลงตะกร้า</button>`;}
document.addEventListener('DOMContentLoaded',async()=>{const pin=document.getElementById('pinSelect');if(pin){const ps=[...await agroServerProducts(),...allListings()];pin.innerHTML=ps.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)} — ฿${money(p.price)}</option>`).join('');if(ps.length)pinProduct();else {const t=document.getElementById('pinnedProduct');if(t)t.textContent='ยังไม่มีสินค้าจริงให้ปักตะกร้า';}}});
