ARG NODE_VERSION=18-alpine
ARG NODE_ENV=production
ARG GIT_HASH=
ARG GIT_BRANCH=

FROM node:${NODE_VERSION} as base

WORKDIR /app
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache jq

COPY package.json .
RUN jq '{ dependencies, devDependencies }' < package.json > deps.json

FROM base AS depBuilder

WORKDIR /app

COPY --from=base /app/deps.json ./package.json
COPY package-lock.json .

RUN npm ci --legacy-peer-deps
# https://docs.npmjs.com/cli/ci.html#description


FROM base AS runner

ARG NODE_ENV
ARG GIT_HASH
ARG GIT_BRANCH

WORKDIR /app

COPY . .
COPY --from=depBuilder /app/node_modules ./node_modules

ENV NODE_ENV $NODE_ENV
ENV GIT_HASH $GIT_HASH
ENV GIT_BRANCH $GIT_BRANCH

CMD ["npm", "start"]
