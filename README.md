# 💕 Lovelog

แอปบันทึกความรักสำหรับคู่รัก — เก็บรูปภาพ ความทรงจำ นับครบรอบ และผังครอบครัว

🔗 **Production:** https://pimuk-dna.vercel.app

---

## Features

- 📸 **Photo Gallery** — อัปโหลดและจัดการรูปภาพคู่รัก (Cloudinary)
- 🗓 **Anniversary Tracking** — นับครบรอบรายเดือนและรายปีอัตโนมัติ
- 📅 **Timeline** — บันทึกความทรงจำสำคัญพร้อมรูปภาพ
- 🌳 **Family Tree** — ผังครอบครัว พ่อแม่ → ลูกๆ
- 👫 **Partner Invite** — ส่งลิงก์เชิญคู่รักมาใช้ร่วมกัน
- 🔐 **Auth** — Email + Password, Forgot Password ผ่าน Resend
- 🌙 **Dark / Light Theme** — Dark Purple (default) / Light Green
- 🗑 **Account Deletion** — ลบบัญชีและข้อมูลทั้งหมดได้เอง
- ☕ **Ko-fi Donate** — [ko-fi.com/pimuk](https://ko-fi.com/pimuk)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Database | MySQL 8 (Railway / Docker) |
| ORM | Prisma 5 |
| Auth | NextAuth.js (JWT) |
| Images | Cloudinary |
| Email | Resend |
| Styling | Tailwind CSS + CSS Variables |
| Font | Prompt (Thai + Latin) |
| Deploy | Vercel |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Clone
git clone https://github.com/pimukchall/lovelog.git
cd lovelog

# 2. Install dependencies
npm install

# 3. Start MySQL
docker compose up -d

# 4. Copy env
cp .env.example .env
# แก้ไขค่าใน .env ให้ครบ

# 5. Push schema
npx prisma db push

# 6. Run dev server
npm run dev
# เปิด http://localhost:3005
```

### Environment Variables

```env
DATABASE_URL=mysql://root:password@localhost:3311/pimuk_dna
AUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3005

CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

RESEND_API_KEY=<your-key>
RESEND_FROM=Lovelog <onboarding@resend.dev>
```

---

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production (auto-deploy to Vercel) |
| `dev` | Development — merge ไป main เมื่อพร้อม |

---

## Developer

พัฒนาโดย **Pimuk Artharnnarong**
📧 pimuk.artharnnarong@gmail.com
☕ [ko-fi.com/pimuk](https://ko-fi.com/pimuk)
