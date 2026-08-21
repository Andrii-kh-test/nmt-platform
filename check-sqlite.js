const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("./prisma/database.db");

const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  .all();

for (const table of tables) {
  const name = table.name;

  const columns = db
    .prepare(`PRAGMA table_info("${name}")`)
    .all();

  const count = db
    .prepare(`SELECT COUNT(*) AS count FROM "${name}"`)
    .get();

  console.log(`\n=== ${name} ===`);
  console.log("Columns:");
  console.table(columns);
  console.log("Rows:", count.count);
}

db.close();
