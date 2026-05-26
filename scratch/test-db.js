const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function test() {
  const db = await open({
    filename: path.resolve(__dirname, '../efitness.db'),
    driver: sqlite3.Database
  });

  const users = await db.all("SELECT id, name, username, role, parent_coach_id FROM users");
  console.log("USERS:", users);

  const keys = await db.all("SELECT * FROM access_keys");
  console.log("ACCESS KEYS:", keys);
}

test().catch(console.error);
