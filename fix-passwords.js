const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function fixPasswords() {
  console.log("🔧 Atualizando senhas dos usuários...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sistema_chamados",
    port: parseInt(process.env.DB_PORT || "3306"),
  });

  try {
    // Gerar hash correto para a senha "123456"
    const password = "123456";
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log("✅ Hash gerado com sucesso!");

    // Atualizar todos os usuários com o novo hash
    await connection.execute(
      "UPDATE users SET password_hash = ?",
      [hash]
    );

    console.log("✅ Senhas de todos os usuários atualizadas para '123456'!");

    // Verificar a atualização
    const [users] = await connection.execute(
      "SELECT email, name FROM users"
    );

    console.log("\n👤 Usuários disponíveis:");
    users.forEach((user) => {
      console.log(`- ${user.email} (${user.name})`);
    });

    console.log("\n✅ Pronto! Agora você pode logar com:");
    console.log("- Qualquer email de usuário");
    console.log("- Senha: 123456");
  } finally {
    await connection.end();
  }
}

fixPasswords().catch((error) => {
  console.error("\n❌ Erro:", error);
  process.exit(1);
});
