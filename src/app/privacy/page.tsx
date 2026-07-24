"use client";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8" style={{ color: "var(--foreground)" }}>
      <div className="text-center space-y-2">
        <div className="text-4xl">💕</div>
        <h1 className="text-3xl font-bold gradient-text">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>มีผลบังคับใช้ตั้งแต่ 24 กรกฎาคม 2568</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6 text-sm leading-relaxed" style={{ border: "1px solid var(--glass-border)" }}>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>1. ข้อมูลที่เราเก็บ</h2>
          <ul className="space-y-1 list-disc list-inside" style={{ color: "var(--muted)" }}>
            <li>ที่อยู่อีเมลและรหัสผ่าน (เข้ารหัสด้วย bcrypt)</li>
            <li>ชื่อของคุณและคู่รัก, วันที่เริ่มคบ</li>
            <li>รูปภาพที่คุณอัปโหลด (จัดเก็บบน Cloudinary)</li>
            <li>ความทรงจำและบันทึกต่างๆ ที่คุณสร้างในแอป</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>2. วัตถุประสงค์การใช้ข้อมูล</h2>
          <ul className="space-y-1 list-disc list-inside" style={{ color: "var(--muted)" }}>
            <li>ให้บริการและแสดงข้อมูลภายในแอปแก่คุณและคู่รัก</li>
            <li>ส่งอีเมลสำหรับการตั้งรหัสผ่านใหม่เมื่อคุณร้องขอ</li>
            <li>ไม่นำข้อมูลไปใช้เพื่อโฆษณาหรือวิเคราะห์เชิงพาณิชย์</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>3. การแบ่งปันข้อมูล</h2>
          <p style={{ color: "var(--muted)" }}>
            เราไม่ขาย ไม่ให้เช่า และไม่เปิดเผยข้อมูลของคุณแก่บุคคลที่สาม
            ยกเว้นผู้ให้บริการโครงสร้างพื้นฐานที่จำเป็น ได้แก่
            <strong> Cloudinary</strong> (จัดเก็บรูปภาพ) และ
            <strong> Resend</strong> (ส่งอีเมล) ซึ่งมีนโยบายความเป็นส่วนตัวของตนเอง
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>4. สิทธิ์ของคุณ</h2>
          <ul className="space-y-1 list-disc list-inside" style={{ color: "var(--muted)" }}>
            <li>ขอดูข้อมูลที่เราเก็บเกี่ยวกับคุณ</li>
            <li>แก้ไขข้อมูลส่วนตัวได้ในหน้าตั้งค่า</li>
            <li>ลบบัญชีและข้อมูลทั้งหมดได้ทันทีในหน้าตั้งค่า → Danger Zone</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>5. การรักษาความปลอดภัย</h2>
          <p style={{ color: "var(--muted)" }}>
            รหัสผ่านถูกเข้ารหัสก่อนบันทึก การเชื่อมต่อใช้ HTTPS
            และ session จัดการด้วย JWT ที่ลงนามแล้ว
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>6. การเก็บข้อมูล</h2>
          <p style={{ color: "var(--muted)" }}>
            ข้อมูลจะถูกเก็บไว้ตราบเท่าที่บัญชียังมีอยู่
            เมื่อคุณลบบัญชี ข้อมูลทั้งหมดรวมถึงรูปภาพบน Cloudinary
            จะถูกลบออกทันที
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base" style={{ color: "var(--accent)" }}>7. ติดต่อเรา</h2>
          <p style={{ color: "var(--muted)" }}>
            หากมีข้อสงสัยเกี่ยวกับนโยบายนี้ ติดต่อได้ที่{" "}
            <a href="mailto:pimuk.artharnnarong@gmail.com" className="underline" style={{ color: "var(--accent)" }}>
              pimuk.artharnnarong@gmail.com
            </a>
          </p>
        </section>

      </div>

      <div className="text-center">
        <Link href="/register"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}>
          <Heart size={16} /> กลับหน้าสมัคร
        </Link>
      </div>
    </div>
  );
}
