# pong7

Проект Pong 8БИТ.

## Локально

```bash
npm install
npm run dev
```

## Деплой на Vercel

Проект — статический сайт без сборки. `index.html`, `src/` и `images/` лежат в корне репозитория, поэтому в `vercel.json` указан `outputDirectory: "."` (иначе Vercel по умолчанию берёт папку `public/` и деплой падает).

1. Импортируй репозиторий на [vercel.com](https://vercel.com)
2. Framework Preset: **Other**
3. Build Command и Output Directory подтянутся из `vercel.json`
4. Deploy
