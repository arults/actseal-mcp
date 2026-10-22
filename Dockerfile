# ActSeal MCP — stdio server for Glama / local Docker
# Starts and answers MCP initialize + tools/list with placeholder env.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm install --no-save tsx@4.20.0 typescript@5.9.0 @types/node@22.0.0

COPY tsconfig.json ./
COPY src ./src

# Defaults so the process boots for introspection (tools/list).
# Override ACTSEAL_API_KEY with a real key from https://actseal.xyz/get-key for issue_receipt.
ENV ACTSEAL_BASE=https://actseal.xyz \
    ACTSEAL_API_KEY=glama_introspect_placeholder \
    NODE_ENV=production

ENTRYPOINT ["npx", "--yes", "tsx", "src/index.ts"]
