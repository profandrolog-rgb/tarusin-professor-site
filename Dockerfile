# ---------- stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Зависимости отдельным слоем — кэшируется, пока не меняется lock-файл
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# Build args Vite. ВАЖНО: без ENV-дублирования — если аргумент не передан,
# переменная остаётся неопределённой и Vite берёт значения из .env.production.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PROXY_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_BACKEND_FALLBACK_URL
ARG VITE_SUPABASE_BUILD_URL
ENV NODE_ENV=production

COPY . .
RUN npm run build

# ---------- stage 2: runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
