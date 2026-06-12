const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runFixMigration() {
  console.log("🔧 Fixing checklist constraints...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sistema_chamados",
    port: parseInt(process.env.DB_PORT || "3306"),
    multipleStatements: true,
  });

  try {
    console.log("✅ Conectado ao banco de dados!");

    // Ler e executar o script de correção
    const migrationPath = path.join(__dirname, "scripts", "14-fix-checklist-constraints.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("\n📄 Recriando tabelas de checklists...");
    await connection.query(migrationSQL);

    console.log("✅ Migration completada com sucesso!");
  } finally {
    await connection.end();
  }
}

runFixMigration().catch((error) => {
  console.error("\n❌ Erro na migration:", error);
  process.exit(1);
});
