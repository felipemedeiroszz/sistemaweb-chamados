# Integração SMS com Twilio

Esta documentação explica como a integração SMS foi implementada no sistema de chamados.

## Configuração

### 1. Banco de Dados
Execute o script SQL para adicionar a coluna phone na tabela users:
```sql
-- Execute o arquivo: scripts/12-add-phone-column.sql
psql -d seu_banco -f scripts/12-add-phone-column.sql
```

### 2. Dependências
A biblioteca Twilio já foi instalada:
```bash
npm install twilio --legacy-peer-deps
```

### 3. Credenciais Twilio
As credenciais estão configuradas em `src/lib/sms.ts`:
- Account SID: AC2257dbe2fa58febf88505c7570b7f53e
- Auth Token: a17aa8601eeccf7ab30f68e2b2cc20f4
- Número: +12403875516

## Funcionalidades Implementadas

### 1. SMS ao Assumir Chamado
- **Quando**: Técnico assume um chamado
- **Endpoint**: `/api/tickets/[id]/assign`
- **Mensagem**: "Olá! Seu chamado #[ID] foi assumido pelo técnico [NOME]. Acompanhe o andamento pelo sistema."

### 2. SMS ao Alterar Status
- **Quando**: Técnico altera status do chamado
- **Endpoint**: `/api/tickets/[id]/update`
- **Status suportados**: em_andamento, aguardando, resolvido
- **Mensagem**: "Seu chamado #[ID] teve o status alterado para: [STATUS]. Verifique os detalhes no sistema."

## Como Usar

### 1. Configurar Telefone da Loja
Adicione o telefone da loja na tabela users:
```sql
UPDATE users 
SET phone = '+5511999999999' 
WHERE id = 'id_da_loja';
```

### 2. Formato do Telefone
- Use formato internacional: `+5511999999999`
- Código do país (55) + DDD + número
- Exemplo: `+5511987654321`

### 3. Teste da Integração
1. Configure um telefone válido para uma loja
2. Crie um chamado como loja
3. Assuma o chamado como técnico
4. Altere o status do chamado
5. Verifique se os SMS foram recebidos

## Logs e Monitoramento

- Erros de SMS são logados no console mas não interrompem a operação
- Verifique os logs do servidor para troubleshooting
- SMS só é enviado se a loja tiver telefone cadastrado

## Estrutura dos Arquivos

```
src/lib/sms.ts                           # Serviço SMS principal
app/api/tickets/[id]/assign/route.ts     # Endpoint de atribuição (modificado)
app/api/tickets/[id]/update/route.ts     # Endpoint de atualização (modificado)
scripts/12-add-phone-column.sql          # Script para adicionar coluna phone
```

## Troubleshooting

### SMS não está sendo enviado
1. Verifique se a loja tem telefone cadastrado
2. Confirme o formato do telefone (+5511999999999)
3. Verifique os logs do servidor
4. Teste as credenciais Twilio

### Erro de dependências
Se houver conflitos ao instalar Twilio:
```bash
npm install twilio --legacy-peer-deps
```

### Formato de telefone inválido
- Use sempre o formato internacional
- Inclua o código do país (+55 para Brasil)
- Não use espaços, parênteses ou hífens