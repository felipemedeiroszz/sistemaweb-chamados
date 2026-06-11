import twilio from 'twilio';

// Configurações do Twilio (mantidas para uso futuro)
const accountSid = 'AC2257dbe2fa58febf88505c7570b7f53e';
const authToken = 'a17aa8601eeccf7ab30f68e2b2cc20f4';
const twilioPhoneNumber = '+12403875516';

// Cliente Twilio (desativado por enquanto)
// const client = twilio(accountSid, authToken);

// Flag para ativar/desativar SMS
const SMS_ENABLED = false;

export interface SMSMessage {
  to: string;
  message: string;
}

/**
 * Envia SMS usando Twilio (DESATIVADO POR ENQUANTO)
 * @param to Número de telefone de destino (formato: +5511999999999)
 * @param message Mensagem a ser enviada
 * @returns Promise com resultado do envio
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // Se SMS estiver desativado, apenas loga e retorna sucesso
    if (!SMS_ENABLED) {
      console.log('[SMS DESATIVADO] SMS não enviado:', { to, message });
      return true;
    }

    // Validar formato do número
    if (!to || !to.startsWith('+')) {
      console.error('Número de telefone inválido:', to);
      return false;
    }

    // Enviar SMS (código mantido para uso futuro)
    // const result = await client.messages.create({
    //   body: message,
    //   from: twilioPhoneNumber,
    //   to: to
    // });

    // console.log('SMS enviado com sucesso:', result.sid);
    return true;
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    return false;
  }
}

/**
 * Envia notificação de chamado assumido
 * @param storePhone Telefone da loja
 * @param ticketId ID do chamado
 * @param technicianName Nome do técnico
 */
export async function sendTicketAssignedSMS(
  storePhone: string,
  ticketId: string,
  technicianName: string
): Promise<boolean> {
  const message = `Olá! Seu chamado #${ticketId} foi assumido pelo técnico ${technicianName}. Acompanhe o andamento pelo sistema.`;
  return await sendSMS(storePhone, message);
}

/**
 * Envia notificação de mudança de status
 * @param storePhone Telefone da loja
 * @param ticketId ID do chamado
 * @param newStatus Novo status do chamado
 */
export async function sendTicketStatusChangeSMS(
  storePhone: string,
  ticketId: string,
  newStatus: string
): Promise<boolean> {
  const statusMessages = {
    'em_andamento': 'em andamento',
    'aguardando': 'aguardando resposta',
    'resolvido': 'resolvido'
  };

  const statusText = statusMessages[newStatus as keyof typeof statusMessages] || newStatus;
  const message = `Seu chamado #${ticketId} teve o status alterado para: ${statusText}. Verifique os detalhes no sistema.`;
  
  return await sendSMS(storePhone, message);
}

/**
 * Para reativar o SMS no futuro:
 * 1. Altere a flag SMS_ENABLED para true
 * 2. Descomente a linha que inicializa o cliente Twilio
 * 3. Descomente o código de envio na função sendSMS
 */