const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  console.log("🔧 Configurando banco de dados...");

  // Primeiro, conectar sem especificar o banco de dados para criá-lo
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT || "3306"),
    multipleStatements: true, // Habilita múltiplos comandos SQL em uma única query
  });

  try {
    console.log("✅ Conectado ao MySQL com sucesso!");

    // Ler e executar o schema
    console.log("\n📄 Criando banco de dados e tabelas...");
    const schemaPath = path.join(__dirname, "scripts", "mysql_schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    
    // Executar todo o schema de uma vez
    await connection.query(schemaSQL);

    console.log("✅ Banco de dados e tabelas criados com sucesso!");

    // Conectar agora ao banco de dados criado
    await connection.changeUser({ database: process.env.DB_NAME || "sistema_chamados" });

    // Ler e executar os dados iniciais
    console.log("\n📄 Inserindo dados iniciais...");
    const initialDataPath = path.join(__dirname, "scripts", "mysql_initial_data.sql");
    const initialDataSQL = fs.readFileSync(initialDataPath, "utf8");
    
    await connection.query(initialDataSQL);

    console.log("✅ Dados iniciais inseridos com sucesso!");

    // Verificar se tudo foi criado
    const [tables] = await connection.query("SHOW TABLES");
    console.log("\n📋 Tabelas no banco de dados:");
    tables.forEach((table) => {
      console.log("-", Object.values(table)[0]);
    });

    const [users] = await connection.query("SELECT COUNT(*) as count FROM users");
    console.log(`\n👤 Total de usuários: ${users[0].count}`);

    console.log("\n🎉 Configuração concluída com sucesso!");
    console.log("\nCredenciais de acesso:");
    console.log("- Admin: admin@empresa.com / 123456");
    console.log("- Lojas: loja1@empresa.com a loja12@empresa.com / 123456");
    console.log("- Técnicos: Veja o arquivo mysql_initial_data.sql");
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error) => {
  console.error("\n❌ Erro ao configurar o banco de dados:", error);
  process.exit(1);
});
