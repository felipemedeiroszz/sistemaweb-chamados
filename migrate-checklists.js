const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runChecklistMigration() {
  console.log("🔧 Executando migração de checklists...");

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

    // Ler e executar o script de migração de checklists
    const migrationPath = path.join(__dirname, "scripts", "13-create-checklist-tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("\n📄 Criando tabelas de checklists...");
    await connection.query(migrationSQL);

    console.log("✅ Tabelas de checklists criadas com sucesso!");

    // Verificar as tabelas criadas
    const [tables] = await connection.query("SHOW TABLES");
    console.log("\n📋 Tabelas no banco de dados:");
    tables.forEach((table) => {
      console.log("-", Object.values(table)[0]);
    });

    console.log("\n🎉 Migração concluída com sucesso!");
  } finally {
    await connection.end();
  }
}

runChecklistMigration().catch((error) => {
  console.error("\n❌ Erro na migração:", error);
  process.exit(1);
});
