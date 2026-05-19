
FROM oven/bun:1 AS base
WORKDIR /usr/src/app


# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

# FROM base AS release
# COPY --from=install /temp/prod/node_modules node_modules
# RUN mkdir -p node_modules/.vite
# COPY --from=prerelease /usr/src/app/dist .
# COPY --from=prerelease /usr/src/app/package.json .

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "start" ]