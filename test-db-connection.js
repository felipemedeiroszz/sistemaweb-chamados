const mysql = require("mysql2/promise");

async function testConnection() {
  console.log("Testando conexão com o banco de dados...");
  console.log("Host:", process.env.DB_HOST || "localhost");
  console.log("Usuário:", process.env.DB_USER || "root");
  console.log("Banco de dados:", process.env.DB_NAME || "sistema_chamados");
  console.log("Porta:", process.env.DB_PORT || 3306);
  console.log("------------------------");

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "sistema_chamados",
      port: parseInt(process.env.DB_PORT || "3306"),
    });

    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");

    // Verificar se as tabelas existem
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("\nTabelas no banco de dados:");
    tables.forEach((table) => {
      console.log("-", Object.values(table)[0]);
    });

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco de dados:");
    console.error(error.message);
    console.error("\nDetalhes do erro:", error);
    process.exit(1);
  }
}

testConnection();
