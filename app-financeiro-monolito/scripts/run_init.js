const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    let sql = fs.readFileSync('scripts/init.sql', 'utf16le');
    
    // Remove o BOM e possíveis caracteres invisíveis no começo
    sql = sql.replace(/^\uFEFF/, '').trim();
    
    console.log("Executing SQL length:", sql.length);
    await pool.query(sql);
    console.log("Successfully executed init.sql!");
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await pool.end();
  }
}
main();

