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

The Apollo client already points at `/graphql`. The server now resolves those GraphQL queries from Postgres through Prisma.

1. Make sure a local PostgreSQL server is running on `localhost:5432`.
2. Set `server/.env` with a direct Postgres connection string.

```env
DATABASE_URL="postgresql://<your-user>@localhost:5432/ncs180"
```

3. Create the `ncs180` database if it does not already exist.

```sh
createdb ncs180
```

4. Apply the Prisma schema.

```sh
npm run db:push --workspace server
```

5. Seed starter records.

```sh
npm run db:seed --workspace server
```

6. Start both apps.

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

6. Push the schema to your local database.

```sh
npm run db:push --workspace server
```

7. Reseed the database.

```sh
npm run db:seed --workspace server
```

If `db:push` fails because you added required columns to a table that already has rows, reset the local database and reseed:

```sh
npm run db:push --workspace server -- --force-reset
npm run db:seed --workspace server
```

Only use `--force-reset` for local/dev data you are OK losing.

## Prisma Drift Troubleshooting

If Prisma throws an error that mentions a field your schema no longer has, or says an argument is missing even though the code looks correct, the generated Prisma client is probably stale.

Common symptom:

- `prismaClient.contact.create()` says `name` is required even though [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma) only has `firstName` and `lastName`.

Fastest fix:

```sh
npm run db:generate --workspace server
```

Then restart the server so it loads the regenerated client.

Helpful checks:

- Confirm the schema shape in [server/prisma/schema.prisma](/Users/lmerr72/Development/ncs180/server/prisma/schema.prisma).
- Confirm the generated client shape in `node_modules/.prisma/client/index.d.ts`.
- If needed, re-apply the schema with `npm run db:push --workspace server`.

If Prisma instead says a column does not exist in the database, the generated client and schema may be correct, but your local Postgres table is still using the old columns.

Common symptom:

- `The column firstName of relation Contact does not exist in the current database.`

Helpful checks:

- Inspect the local table shape with `psql postgresql://<your-user>@localhost:5432/ncs180 -c '\d "Contact"'`.
- If `db:push` reports that it cannot add required columns because rows already exist, backfill those values before dropping the old column.

Safe migration pattern for local dev:

1. Add the new columns as nullable in Postgres.
2. Copy data from the old column into the new columns.
3. Run `npm run db:push --workspace server -- --accept-data-loss` only after the replacement data is present.

Example for the `Contact.name` to `Contact.firstName` + `Contact.lastName` change:

```sh
psql postgresql://<your-user>@localhost:5432/ncs180 -c "ALTER TABLE \"Contact\" ADD COLUMN IF NOT EXISTS \"firstName\" text; ALTER TABLE \"Contact\" ADD COLUMN IF NOT EXISTS \"lastName\" text; UPDATE \"Contact\" SET \"firstName\" = split_part(trim(name), ' ', 1), \"lastName\" = CASE WHEN strpos(trim(name), ' ') > 0 THEN btrim(substr(trim(name), strpos(trim(name), ' ') + 1)) ELSE '' END WHERE \"firstName\" IS NULL OR \"lastName\" IS NULL;"
npm run db:push --workspace server -- --accept-data-loss
```

Only use `--accept-data-loss` after you have verified the replacement columns are populated, because Prisma may drop the old column as part of the sync.

## Structure

- `client/` contains the React app
- `server/` contains the Node.js API and tests
