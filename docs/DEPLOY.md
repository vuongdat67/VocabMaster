# Deploy

Support cả hai nền tảng: **GitHub Pages** và **Cloudflare Pages** (chạy song song).

## GitHub Pages

### Lần đầu

```bash
# Sau khi push lên GitHub repo:
# Lên repo → Settings → Pages → Source: GitHub Actions
```

Workflow `.github/workflows/deploy.yml` tự động build + deploy khi push `main`.

### Cách hoạt động

- `public/404.html` — SPA redirect fallback cho GitHub Pages
- `vite.config.ts` có `base: './'` cho relative path

### URL

```
https://vuongdat67.github.io/VocabMaster/
```

---

## Cloudflare Pages

### Lần đầu

1. Vào [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Pages** → **Create a project**
3. **Connect Git** → chọn `vuongdat67/VocabMaster`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Build output: `dist`
7. **Deploy!**

### SPA routing

`_redirects` file đã có sẵn ở root:

```
/*    /index.html    200
```

Cloudflare tự động detect.

### URL

```
https://vocabmaster.pages.dev/
(có thể custom domain)
```

---

## Yêu cầu

- Node.js 18+
- npm

```bash
npm install
npm run dev      # local dev (localhost:5173)
npm run build    # production build (→ dist/)
npm run preview  # preview build
```
