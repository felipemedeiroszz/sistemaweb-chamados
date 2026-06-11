const bcrypt = require("bcryptjs");

const testPassword = "123456";
const storedHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

console.log("Testando senha:", testPassword);
console.log("Hash armazenado:", storedHash);

bcrypt.compare(testPassword, storedHash, (err, result) => {
  if (err) {
    console.error("Erro:", err);
  } else {
    console.log("Senha válida?", result);
  }
});

// Vamos gerar um novo hash para confirmar
const newHash = bcrypt.hashSync(testPassword, 10);
console.log("\nNovo hash para senha 123456:", newHash);
