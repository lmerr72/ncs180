# NCS180 Starter

Basic full-stack starter with:

- React 19 client powered by Webpack 5
- Node.js server using Express, Apollo GraphQL, and Prisma
- Jest + Supertest test structure for the server

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

## Postgres Setup

The Apollo client points at `/graphql` by default. The server now resolves those GraphQL queries from Postgres through Prisma.

For split deployments where the static client and Node API are on different origins, set `NCS180_API_BASE_URL` when building the client:

```sh
NCS180_API_BASE_URL="https://your-api.example.com" npm run build --workspace client
```

On a backend-only deployment, `client/dist/index.html` may not exist. That is fine for API-only hosting; `/api` and `/graphql` will still be served. For a single full-stack deployment, build the client before starting the server:

```sh
npm run build --workspace client
npm run start --workspace server
```

1. Make sure a local PostgreSQL server is running on `localhost:5434`.
2. Set `server/.env` with a direct Postgres connection string.

```env
DATABASE_URL="postgresql://<your-user>@localhost:5434/ncs180"
```

3. Create the `ncs180` database if it does not already exist.

```sh
createdb ncs180
```

4. Generate the Prisma client so schema-level defaults like `cuid()` are available to runtime writes.

```sh
npm run db:generate --workspace server
```

5. Apply the Prisma schema.

```sh
npm run db:push --workspace server
```

6. Seed starter records.

```sh
npm run db:seed --workspace server
```

7. Start both apps.

```sh
npm run dev
```

After seeding, the local database should contain 10 users and 4 clients.

## Updating The Schema Next Time

When a Prisma model changes, update the code in this order so local dev stays in sync:

1. Update the Prisma model in [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma).
2. Update the seed shapes and mapping helpers in [server/src/graphql/seedData.js](/Users/lmerr72/Development/ncs180/server/src/graphql/seedData.js).
3. Update any datastore or GraphQL behavior that reads or writes the changed fields.
4. Update integration tests, especially [server/tests/integration/graphql.test.js](/Users/lmerr72/Development/ncs180/server/tests/integration/graphql.test.js), so queries and mutations assert the new shape.
5. Run the server tests.

```sh
npm test --workspace server -- --runInBand
```

6. Regenerate the Prisma client.

```sh
npm run db:generate --workspace server
```

7. Push the schema to your local database.

```sh
npm run db:push --workspace server
```

8. Reseed the database.

```sh
npm run db:seed --workspace server
```

If `db:push` fails because you added required columns to a table that already has rows, reset the local database and reseed:

```sh
npm run db:push --workspace server -- --force-reset
npm run db:seed --workspace server
```

Only use `--force-reset` for local/dev data you are OK losing.

## Adding A New Table

When you add a brand-new database table in this project, update both the database schema and the GraphQL server shape in the same pass:

1. Add the Prisma model and relations in [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma).
2. Add a new SQL migration file under [server/prisma/migrations](/Users/lmerr72/Development/ncs180/server/prisma/migrations) for the table, indexes, foreign keys, and any constraints Prisma does not express directly the way you want.
3. Regenerate Prisma Client.

```sh
npm run db:generate --workspace server
```

4. If the new table should be cleared during reseeds, update [server/prisma/seed.js](/Users/lmerr72/Development/ncs180/server/prisma/seed.js).
5. If the table needs starter records or mapping helpers, update [server/src/graphql/seedData.js](/Users/lmerr72/Development/ncs180/server/src/graphql/seedData.js).
6. Add or update GraphQL types, queries, and mutations in [server/src/graphql/schema.js](/Users/lmerr72/Development/ncs180/server/src/graphql/schema.js).
7. Update datastore behavior in [server/src/graphql/postgresDataStore.js](/Users/lmerr72/Development/ncs180/server/src/graphql/postgresDataStore.js) and [server/src/graphql/mockDataStore.js](/Users/lmerr72/Development/ncs180/server/src/graphql/mockDataStore.js) if the new table is read or written through the API.
8. Update tests that cover the new schema behavior, especially [server/tests/integration/graphql.test.js](/Users/lmerr72/Development/ncs180/server/tests/integration/graphql.test.js).

To apply the new table locally:

```sh
npm run db:generate --workspace server
psql "$DATABASE_URL" -f server/prisma/migrations/<timestamp>_<migration_name>/migration.sql
```

To inspect the table later and confirm its columns:

```sh
psql "$DATABASE_URL" -c '\d "Files"'
```

If Prisma can safely reconcile the whole schema, you can use:

```sh
npm run db:push --workspace server
```

Use the direct `psql` migration route when `db:push` is blocked by unrelated local schema drift and you only need to add the new table.

## Prisma Drift Troubleshooting

If Prisma throws an error that mentions a field your schema no longer has, or says an argument is missing even though the code looks correct, the generated Prisma client is probably stale.

Common symptom:

- `prismaClient.contact.create()` says `name` is required even though [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma) only has `firstName` and `lastName`.

Fastest fix:

```sh
npm run db:generate --workspace server
```

Then restart the server so it loads the regenerated client.

This is especially important after switching Prisma IDs to `@default(cuid())`, because Prisma may still think `id` is required until the generated client is refreshed.

## Prisma Migrations

This repo now includes Prisma migration files under [server/prisma/migrations](/Users/lmerr72/Development/ncs180/server/prisma/migrations).

Current note:

- `20260331190500_prisma_generated_ids` tracks the move from manually assigned Prisma IDs to schema-level `@default(cuid())` on `User`, `Client`, and `Contact`.
- That migration is intentionally SQL-free because `cuid()` is generated by Prisma Client, not by a native PostgreSQL default.

When you pull schema changes:

1. Run `npm run db:generate --workspace server`.
2. Run `npm run db:push --workspace server`.
3. Restart the server.

Helpful checks:

- Confirm the schema shape in [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma).
- Confirm the generated client shape in `node_modules/.prisma/client/index.d.ts`.
- If needed, re-apply the schema with `npm run db:push --workspace server`.

If Prisma instead says a column does not exist in the database, the generated client and schema may be correct, but your local Postgres table is still using the old columns.

Common symptom:

- `The column firstName of relation Contact does not exist in the current database.`

Helpful checks:

- Inspect the local table shape with `psql postgresql://<your-user>@localhost:5434/ncs180 -c '\d "Contact"'`.
- If `db:push` reports that it cannot add required columns because rows already exist, backfill those values before dropping the old column.

Safe migration pattern for local dev:

1. Add the new columns as nullable in Postgres.
2. Copy data from the old column into the new columns.
3. Run `npm run db:push --workspace server -- --accept-data-loss` only after the replacement data is present.

Example for the `Contact.name` to `Contact.firstName` + `Contact.lastName` change:

```sh
psql postgresql://<your-user>@localhost:5434/ncs180 -c "ALTER TABLE \"Contact\" ADD COLUMN IF NOT EXISTS \"firstName\" text; ALTER TABLE \"Contact\" ADD COLUMN IF NOT EXISTS \"lastName\" text; UPDATE \"Contact\" SET \"firstName\" = split_part(trim(name), ' ', 1), \"lastName\" = CASE WHEN strpos(trim(name), ' ') > 0 THEN btrim(substr(trim(name), strpos(trim(name), ' ') + 1)) ELSE '' END WHERE \"firstName\" IS NULL OR \"lastName\" IS NULL;"
npm run db:push --workspace server -- --accept-data-loss
```

Only use `--accept-data-loss` after you have verified the replacement columns are populated, because Prisma may drop the old column as part of the sync.

## Structure

- `client/` contains the React app
- `server/` contains the Node.js API and tests
