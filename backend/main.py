from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from pathlib import Path
import sqlite3, hashlib, secrets, os, json, re

DB_PATH = Path(os.getenv("AGRO_DB_PATH", Path(__file__).with_name("agroconnect.db")))
app = FastAPI(title="AgroConnect API", version="1.0.0", description="API สำหรับบัญชีสมาชิกและสินค้า AgroConnect")
origins = [x.strip() for x in os.getenv("AGRO_CORS_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET","POST","DELETE","OPTIONS"], allow_headers=["Authorization","Content-Type"])

def db():
    con=sqlite3.connect(DB_PATH); con.row_factory=sqlite3.Row; return con

def init_db():
    with db() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, fullname TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, gender TEXT, birth_date TEXT, privacy_consent INTEGER NOT NULL DEFAULT 0, privacy_notice_version TEXT, privacy_consent_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)''')
        # Migrate an existing database created by an earlier package version.
        cols={row['name'] for row in c.execute('PRAGMA table_info(users)').fetchall()}
        for name, definition in [('gender','TEXT'),('birth_date','TEXT'),('privacy_consent','INTEGER NOT NULL DEFAULT 0'),('privacy_notice_version','TEXT'),('privacy_consent_at','TEXT')]:
            if name not in cols: c.execute(f'ALTER TABLE users ADD COLUMN {name} {definition}')
        c.execute('''CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))''')
        c.execute('''CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL CHECK(price>0), unit TEXT NOT NULL, province TEXT NOT NULL, photo_data TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(owner_id) REFERENCES users(id))''')
init_db()

def password_hash(password: str, salt: Optional[str]=None):
    salt=salt or secrets.token_hex(16)
    digest=hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000).hex()
    return f"{salt}${digest}"
def verify_password(password, stored):
    try:
        salt,digest=stored.split('$',1)
        return secrets.compare_digest(password_hash(password,salt).split('$',1)[1],digest)
    except Exception: return False

class RegisterIn(BaseModel):
    username: str = Field(min_length=3,max_length=40,pattern=r'^[A-Za-z0-9_.-]+$')
    fullname: str = Field(min_length=2,max_length=120)
    email: str = Field(min_length=5,max_length=254)
    password: str = Field(min_length=10,max_length=128)
    gender: Optional[str] = None
    birthDate: Optional[str] = None
    privacyConsent: bool = False
class LoginIn(BaseModel):
    username: str
    password: str
class ProductIn(BaseModel):
    name: str = Field(min_length=2,max_length=120)
    category: str = Field(min_length=1,max_length=80)
    price: float = Field(gt=0, le=1000000000)
    unit: str = Field(min_length=1,max_length=30)
    province: str = Field(min_length=1,max_length=100)
    photoData: str = Field(min_length=20,max_length=5_000_000)

def get_user(authorization: Optional[str]=Header(default=None)):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'กรุณาเข้าสู่ระบบ')
    token=authorization[7:].strip()
    with db() as c: row=c.execute('SELECT u.id,u.username,u.fullname,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?',(token,)).fetchone()
    if not row: raise HTTPException(401,'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
    return dict(row)

@app.get('/')
def health(): return {'message':'AgroConnect API is running','status':'ok'}
@app.get('/health')
def health_check(): return {'status':'ok'}
@app.post('/api/register', status_code=201)
def register(data:RegisterIn):
    if not data.privacyConsent:
        raise HTTPException(422,'กรุณาอ่านประกาศความเป็นส่วนตัวและทำเครื่องหมายยินยอมก่อนสมัครสมาชิก')
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$',data.email): raise HTTPException(422,'รูปแบบอีเมลไม่ถูกต้อง')
    with db() as c:
        try:
            cur=c.execute('INSERT INTO users(username,fullname,email,password_hash,gender,birth_date,privacy_consent,privacy_notice_version,privacy_consent_at) VALUES(?,?,?,?,?,?,1,?,CURRENT_TIMESTAMP)',(data.username,data.fullname.strip(),data.email.lower().strip(),password_hash(data.password),data.gender,data.birthDate,'1.0'))
        except sqlite3.IntegrityError:
            raise HTTPException(409,'Username หรืออีเมลนี้ถูกใช้แล้ว')
        return {'message':'สมัครสมาชิกสำเร็จ','user':{'id':cur.lastrowid,'username':data.username,'fullname':data.fullname,'email':data.email.lower()},'privacyConsentRecorded':True,'privacyNoticeVersion':'1.0'}
@app.post('/api/login')
def login(data:LoginIn):
    with db() as c: row=c.execute('SELECT * FROM users WHERE username=?',(data.username,)).fetchone()
    if not row or not verify_password(data.password,row['password_hash']): raise HTTPException(401,'Username หรือ Password ไม่ถูกต้อง')
    token=secrets.token_urlsafe(36)
    with db() as c: c.execute('INSERT INTO sessions(token,user_id) VALUES(?,?)',(token,row['id']))
    return {'token':token,'user':{'id':row['id'],'username':row['username'],'fullname':row['fullname'],'email':row['email']}}
@app.post('/api/logout')
def logout(user=Depends(get_user), authorization: str=Header()):
    token=authorization[7:].strip()
    with db() as c: c.execute('DELETE FROM sessions WHERE token=?',(token,))
    return {'message':'ออกจากระบบแล้ว'}
@app.get('/api/me')
def me(user=Depends(get_user)): return user
@app.get('/api/products')
def list_products():
    with db() as c: rows=c.execute('SELECT p.id,p.name,p.category,p.price,p.unit,p.province,p.photo_data AS photoData,u.username AS seller,p.created_at AS createdAt FROM products p JOIN users u ON u.id=p.owner_id ORDER BY p.created_at DESC').fetchall()
    return [dict(x) for x in rows]
@app.post('/api/products', status_code=201)
def create_product(data:ProductIn,user=Depends(get_user)):
    if not data.photoData.startswith('data:image/'): raise HTTPException(422,'ไฟล์รูปสินค้าไม่ถูกต้อง')
    pid='agc-'+secrets.token_hex(8)
    with db() as c: c.execute('INSERT INTO products(id,owner_id,name,category,price,unit,province,photo_data) VALUES(?,?,?,?,?,?,?,?)',(pid,user['id'],data.name.strip(),data.category,data.price,data.unit,data.province.strip(),data.photoData))
    return {'id':pid,'owner':user['username'],'seller':user['fullname'],**data.model_dump()}
@app.delete('/api/products/{product_id}')
def delete_product(product_id:str,user=Depends(get_user)):
    with db() as c:
        cur=c.execute('DELETE FROM products WHERE id=? AND owner_id=?',(product_id,user['id']))
        if cur.rowcount==0: raise HTTPException(404,'ไม่พบสินค้าของคุณ')
    return {'message':'ลบสินค้าแล้ว'}
