# Flight Pricelist

Next.js приложение для поиска и агрегации авиапредложений через B2B API.

## Локальный запуск

1. Установить зависимости:
   - `npm install`
2. Скопировать переменные окружения:
   - `copy .env.example .env.local`
3. Заполнить значения в `.env.local`.
4. Запустить проект:
   - `npm run dev`

## Деплой на Vercel

1. Импортировать репозиторий в [Vercel](https://vercel.com/new).
2. Framework Preset: `Next.js` (определится автоматически).
3. В разделе Environment Variables добавить:
   - `B2B_API_URL`
   - `B2B_TOKEN`
   - `NEXT_PUBLIC_DEFAULT_CARRIER`
   - `B2B_ETM_AUTH_KEY`
   - `B2B_SESSION_COOKIE`
4. Команды оставить по умолчанию:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: не заполнять
5. Нажать Deploy.

## Проверка после деплоя

- Открыть главную страницу и выполнить поиск рейса.
- Проверить ответы API-роутов:
  - `/api/search`
  - `/api/offers`
