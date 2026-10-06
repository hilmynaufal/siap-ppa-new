# Image untuk staging/produksi SIAP PPA New (Next.js standalone).
#   Aplikasi : docker build -t siap-ppa .
#   Migrasi  : docker build --target migrasi -t siap-ppa-migrasi .
#              docker run --rm -e DATABASE_URL=... siap-ppa-migrasi
# Variabel wajib saat aplikasi berjalan: DATABASE_URL, SESSION_SECRET (acak, min. 32 karakter).

FROM node:22-slim AS dasar
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM dasar AS dependensi
COPY package.json package-lock.json ./
RUN npm ci

FROM dependensi AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# Target terpisah untuk menjalankan migrasi (butuh CLI Prisma yang tidak ada di image aplikasi).
FROM dependensi AS migrasi
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["npx", "prisma", "migrate", "deploy"]

FROM dasar AS aplikasi
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Berkas unggahan disimpan di luar akar web; pasang volume pada /data/uploads.
RUN mkdir -p /data/uploads && chown app:app /data/uploads
USER app
EXPOSE 3000
CMD ["node", "server.js"]
