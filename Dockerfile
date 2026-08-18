# ---------- stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Зависимости ставим отдельным слоем: пока package.json/lock не менялись,
# этот слой берётся из кэша и npm ci не выполняется повторно.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# Переменные сборки Vite (при необходимости задаются как build args в Timeweb).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    NODE_ENV=production

# Исходники копируем после установки зависимостей.
COPY . .

RUN npm run build

# ---------- stage 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
