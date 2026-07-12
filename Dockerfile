FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

COPY package.json ./
RUN npm install

COPY . .

# Build-time arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3081

RUN npm run build

# Expose the admin port
EXPOSE 3081

CMD ["npm", "run", "start"]
