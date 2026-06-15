# ── Single-stage production build ───────────────────────────────────────────
# Simpler and more reliable than multi-stage for Cloud Run source deploys
FROM node:20-alpine
WORKDIR /app

# Install libc compatibility
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Build-time env vars — NEXT_PUBLIC_* are Firebase config values.
# Firebase security model: these are DESIGNED to be public.
# Actual data security is enforced by Firestore Security Rules.
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBekS8umeyDKTSdj5otXbdTIoQaZXdInV0
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=krishicarbon-ai-d08f5.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=krishicarbon-ai-d08f5
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=krishicarbon-ai-d08f5.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=643177525108
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:643177525108:web:ea0ce9b60cd17b02370621
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Cloud Run uses PORT env var — Next.js start reads it automatically
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["npm", "start"]
