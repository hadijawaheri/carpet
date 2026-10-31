# CLAUDE.md — حافظه‌ی دائمی پروژه

> این فایل در ابتدای هر جلسه‌ی Claude Code خوانده می‌شود. قبل از هر کار، بخش «وضعیت پروژه» را بخوان و مرحله‌ی فعلی را اعلام کن.

## وضعیت پروژه

- **نام پروژه:** فرش، Farsh (`carpet`)
- **هدف نهایی:** وب روی Vercel (پروژه‌ی `farsh`) و API روی سرور هادی پشت Caddy (پورت 7811 فقط روی `127.0.0.1`)
- **مرحله‌ی فعلی:** ۵. استقرار (نیمه‌کاره). آخرین commit شاخه‌ی اصلی (`3ecbe96`) روی Vercel در حالت production و READY است. API هنوز روی سرور بالا نیامده؛ اجرای `scripts/server/deploy-apis.sh` در `ruflo-hq` با هادی است.
- **مرحله‌ی بعدی:** ۶. نگهداری، بعد از بالا آمدن API و Redeploy پروژه‌ی Vercel.
- **آخرین به‌روزرسانی:** 2026-10-31
- **تصمیم‌های باز:**
  - IP واقعی کاربر و محدودیت‌های per-IP: همه‌ی درخواست‌ها از Vercel به API می‌رسند و طبق `docs/deploy/api-on-own-server.md` پیش از go-live یک تغییر کد لازم دارد.
  - `next` روی 16.3.8 است و طبق گزارش هفتگی ۳۱ اکتبر آسیب‌پذیری critical دارد؛ پیش از استقرار کامل باید به 16.4.1 یا بالاتر برود.
  - عکس‌های بیشتر فرش (C9) منتظر هادی است؛ عکس فقط از خود هادی، هیچ فرشی کشیده یا ساخته نمی‌شود.
- **تصمیم‌های ثبت‌شده:**
  - پنل مدیریت کاتالوگ در `/dashboard/catalogue` (PR #20) و آپلود عکس روی دیسک سرور (PR #19)؛ پوشه‌ی `MEDIA_DIR` بیرون از release و داخل پشتیبان.
  - دیدن فرش در اندازه‌ی واقعی با AR گوشی (PR #21).
  - فونت‌ها self-host شده‌اند تا build تصادفی خراب نشود (PR #22).
  - مقاله‌های دانشنامه منتشر شده‌اند (PR #17).
  - تا ملی‌پیامک، API با `SMS_PROVIDER=disabled` بالا می‌آید (PR #18).

### مراحل پروژه (به ترتیب)

0. **آماده‌سازی:** ریپو، گیت، محیط توسعه و دسترسی‌ها
1. **برنامه‌ریزی:** نیازمندی‌ها، معماری، ویژگی‌های نهایی
2. **راه‌اندازی محیط:** وابستگی‌ها، متغیرهای محیطی، اجرای لوکال
3. **ساخت:** پیاده‌سازی ویژگی‌ها به ترتیب اولویت
4. **کیفیت:** تست، لینت، بررسی امنیت، دیباگ
5. **استقرار:** انتخاب محل، CI/CD، دامنه، SSL، مانیتورینگ
6. **نگهداری:** باگ‌ها، به‌روزرسانی وابستگی‌ها، پشتیبان‌گیری

## نحوه‌ی کار

- در شروع هر جلسه: مرحله‌ی فعلی را بگو، بگو چه چیزی در جلسه‌ی قبل تمام شد، و **۱ تا ۳ سؤال مشخص** درباره‌ی گام بعدی بپرس تا پروژه به استقرار کامل برسد.
- قبل از رفتن به مرحله‌ی بعد، مطمئن شو که شروط مرحله‌ی فعلی برآورده شده‌اند (مثلاً برای رفتن به «استقرار» باید تست‌ها سبز باشند و محیط لوکال کار کند).
- بعد از هر تغییر در مرحله، یا وقتی تصمیم مهمی گرفته شد، همین بخش «وضعیت پروژه» را به‌روز کن. فقط آنچه واقعاً انجام شده یا تأیید شده را بنویس.
- بدون تأیید صریح کاربر، کد را روی شاخه‌ی اصلی push نکن، چیزی را منتشر یا حذف نکن، و هزینه‌ای ایجاد نکن (سرور، دامنه، سرویس ابری).
- اگر چیزی در وضعیت ثبت‌شده با واقعیت پروژه نمی‌خواند، قبل از ادامه همان را گزارش بده.
- مرحله‌ی همه‌ی پروژه‌ها در `projects.yaml` ریپوی `hadijawaheri/ruflo-hq` هم ثبت است و گزارش هفتگی آن را با این بخش مقایسه می‌کند. اگر مرحله را اینجا عوض کردی، در گزارش کار بگو.

## قواعد فنی

- زبان پاسخ‌ها: فارسی؛ نام‌های فنی، دستورها و کد به انگلیسی.
- کد جدید را همراه با تست یا دست‌کم دستور اجرای دستی بنویس.
- کامیت‌ها کوچک و با پیام واضح باشند.
- اسرار (کلید API، پسورد، توکن) را هرگز داخل کد یا این فایل نگذار؛ از `.env` و متغیرهای محیطی استفاده کن.
- قواعد کدنویسی همین ریپو در بخش «Agent Rules» پایین این فایل آمده است؛ برای کد و ساختار پروژه همان‌ها ملاک است.

## چک‌لیست استقرار (مرحله‌ی ۵)

- [x] ساخت موفق پروژه (`build`): در CI روی شاخه‌ی اصلی سبز است
- [x] تست‌ها سبز هستند (unit، API و web e2e در CI)
- [ ] متغیرهای محیطی تولید تعریف شده‌اند: `INTERNAL_API_URL` روی Vercel گذاشته شده؛ متغیرهای API روی سرور با اجرای اسکریپت ساخته می‌شوند
- [ ] گیت‌هاب ریپو و شاخه‌ی اصلی محافظت شده است (بررسی نشده)
- [x] CI/CD فعال است (GitHub Actions، و Vercel از شاخه‌ی اصلی دیپلوی می‌کند)
- [x] محل استقرار انتخاب و تأیید شده است (وب Vercel، API سرور هادی)
- [ ] دامنه و SSL تنظیم شده‌اند: وب روی `vercel.app` آماده است؛ API هنوز نه
- [ ] پشتیبان‌گیری و مانیتورینگ/لاگ فعال است (`scripts/backup-db.sh` هست، روی سرور فعال نشده)
- [ ] کاربر استقرار نهایی را تأیید کرده است

## Farsh — Agent Rules

Source of truth: PROJECT_BLUEPRINT_SHADCN.md (kept outside this repo). This file is the short, always-loaded subset.

### Commands

- `pnpm dev` | `pnpm typecheck` | `pnpm lint` | `pnpm test` | `pnpm build`
- Build `@farsh/contracts` before typechecking the web app: `pnpm --filter @farsh/contracts build`.
- Use pnpm only. The lockfile is committed. TypeScript and ESLint are pinned in the pnpm catalog on purpose.

### Architecture

- apps/web (Next.js App Router :7782), apps/api (NestJS 12 ESM :7781, MongoDB, docs/adr/0006), packages/contracts (Zod, shared).
- Data shapes (carpets, materials, presets) live ONLY in packages/contracts.
- 3D lives in apps/web/src/features/carpet-viewer. `cloth-solver.ts` stays free of React and three.js.
- Carpet images come only from the owner's photos in apps/web/public/carpets. Never draw or generate a carpet.

### Code

- TS strict, no `any`, `catch (e: unknown)`. kebab-case files, named exports, no `I` prefix.
- Comments explain WHY only. Imports are sorted by ESLint.
- `page.tsx` = routing only. `"use client"` only on leaves.
- React Compiler is on: mutate simulation state through methods on objects created in `useMemo`, never by assigning props during render.

### UI (shadcn, RTL)

- Semantic tokens only (globals.css). No raw colors in components, no `dark:` overrides, no `space-x/y`.
- Logical classes only (ms/me/ps/pe/start/end). Directional icons: `rtl:rotate-180`.
- UI copy is Persian; code, names, comments and commits are English.

### Done means

typecheck + lint + tests actually run and green, build passes, loading/empty/error states handled, ADR for new decisions.
