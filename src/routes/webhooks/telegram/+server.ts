import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } from '$env/static/private';
import { processNLRequest } from '$lib/nl.js';
import type { PatientCandidate, Intent } from '$lib/nl.js';

// Telegram Bot API types
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data: string;
  }>>;
}

// Security constants
const MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB limit

// Simple in-memory store for pending disambiguations (in production, use Redis)
const pendingDisambiguations = new Map<string, { intent: Intent; candidates: PatientCandidate[] }>();

/**
 * Send message via Telegram Bot API
 */
async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: TelegramInlineKeyboard
): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const payload: {
    chat_id: number;
    text: string;
    parse_mode: string;
    reply_markup?: TelegramInlineKeyboard;
  } = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    // eslint-disable-next-line no-undef
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
    }
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

/**
 * Answer callback query
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  
  const payload: {
    callback_query_id: string;
    text?: string;
  } = {
    callback_query_id: callbackQueryId,
  };

  if (text) {
    payload.text = text;
  }

  try {
    // eslint-disable-next-line no-undef
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram answerCallbackQuery error:', response.status, errorText);
    }
  } catch (err) {
    console.error('Failed to answer callback query:', err);
  }
}

/**
 * Create inline keyboard for patient disambiguation
 */
function createDisambiguationKeyboard(candidates: PatientCandidate[]): TelegramInlineKeyboard {
  return {
    inline_keyboard: candidates.map((candidate, index) => [{
      text: `${candidate.name} — ${candidate.hospital} / ${candidate.bangsal} / Kamar ${candidate.room}`,
      callback_data: `select_patient_${index}`,
    }]),
  };
}

/**
 * Process callback query for patient selection
 */
async function handleCallbackQuery(update: TelegramUpdate): Promise<void> {
  const callbackQuery = update.callback_query!;
  const userId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message?.chat.id;

  if (!chatId) {
    await answerCallbackQuery(callbackQuery.id, 'Error: Invalid callback');
    return;
  }

  // Parse callback data
  const callbackData = callbackQuery.data || '';
  const match = callbackData.match(/^select_patient_(\d+)$/);
  
  if (!match) {
    await answerCallbackQuery(callbackQuery.id, 'Error: Invalid selection');
    return;
  }

  const selectedIndex = parseInt(match[1]);
  const pending = pendingDisambiguations.get(userId);

  if (!pending) {
    await answerCallbackQuery(callbackQuery.id, 'Error: Selection expired');
    await sendTelegramMessage(chatId, 'Maaf, pilihan sudah kedaluwarsa. Silakan kirim perintah lagi.');
    return;
  }

  // Clear pending disambiguation
  pendingDisambiguations.delete(userId);

  if (selectedIndex >= pending.candidates.length) {
    await answerCallbackQuery(callbackQuery.id, 'Error: Invalid patient selection');
    return;
  }

  const selectedPatient = pending.candidates[selectedIndex];
  await answerCallbackQuery(callbackQuery.id, `Dipilih: ${selectedPatient.name}`);

  // Process the original intent with the selected patient
  try {
    if (pending.intent.type === 'ask_diagnosis') {
      const { getLatestSoap } = await import('$lib/nl.js');
      const soap = await getLatestSoap(selectedPatient.id, userId);
      
      if (!soap || !soap.a) {
        await sendTelegramMessage(chatId, `Belum ada diagnosis untuk pasien <b>${selectedPatient.name}</b>.`);
        return;
      }
      
      await sendTelegramMessage(chatId, `<b>Diagnosis ${selectedPatient.name}:</b>\n${soap.a}`);
      
    } else if (pending.intent.type === 'add_medication' && pending.intent.medication) {
      const { addMedicationToPlan } = await import('$lib/nl.js');
      const { planSummary } = await addMedicationToPlan(selectedPatient.id, userId, pending.intent.medication);
      
      const formattedResponse = `<b>Obat ditambahkan untuk ${selectedPatient.name}:</b>\n\n<pre>${planSummary}</pre>`;
      await sendTelegramMessage(chatId, formattedResponse);
    }
  } catch (err) {
    console.error('Error processing selected patient:', err);
    await sendTelegramMessage(chatId, 'Maaf, terjadi kesalahan saat memproses pilihan Anda.');
  }
}

/**
 * Process incoming text message
 */
async function handleTextMessage(update: TelegramUpdate): Promise<void> {
  const message = update.message!;
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from.id.toString();

  try {
    // Process natural language request
    const result = await processNLRequest(text, userId);

    if (!result.success) {
      if (result.needsDisambiguation && result.candidates) {
        // Store pending disambiguation
        pendingDisambiguations.set(userId, {
          intent: result.originalIntent!,
          candidates: result.candidates,
        });

        // Create inline keyboard for patient selection
        const keyboard = createDisambiguationKeyboard(result.candidates);
        await sendTelegramMessage(
          chatId,
          '🔍 Ditemukan beberapa pasien dengan nama tersebut. Pilih pasien yang dimaksud:',
          keyboard
        );
      } else {
        await sendTelegramMessage(chatId, `❌ ${result.error || 'Terjadi kesalahan.'}`);
      }
    } else {
      // Format successful response with appropriate styling
      const response = result.result || 'Perintah berhasil diproses.';
      
      // Check if response contains plan information (diagnosis or medication)
      if (response.includes('Plan Aktif') || response.includes('Plan Selesai')) {
        await sendTelegramMessage(chatId, `✅ <pre>${response}</pre>`);
      } else if (response.includes('Diagnosis')) {
        await sendTelegramMessage(chatId, `🏥 <b>${response}</b>`);
      } else {
        await sendTelegramMessage(chatId, `✅ ${response}`);
      }
    }
  } catch (err) {
    console.error('Error processing message:', err);
    await sendTelegramMessage(chatId, 'Maaf, terjadi kesalahan saat memproses perintah Anda.');
  }
}

/**
 * Main webhook handler
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Security checks
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET) {
      console.error('Missing Telegram environment variables');
      throw error(500, 'Server configuration error');
    }

    // Verify secret header
    const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Invalid webhook secret:', secretHeader);
      throw error(401, 'Unauthorized');
    }

    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw error(400, 'Invalid content type');
    }

    // Read and validate payload size
    const body = await request.text();
    if (body.length > MAX_PAYLOAD_SIZE) {
      console.warn('Payload too large:', body.length);
      throw error(413, 'Payload too large');
    }

    let update: TelegramUpdate;
    try {
      update = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError);
      throw error(400, 'Invalid JSON');
    }

    // Validate required fields
    if (typeof update.update_id !== 'number') {
      throw error(400, 'Invalid update format');
    }

    // Idempotency check (simple implementation)
    // In production, you should store processed update_ids in Redis/database
    // and check for duplicates here

    // Process different update types
    if (update.callback_query) {
      await handleCallbackQuery(update);
    } else if (update.message && update.message.text) {
      await handleTextMessage(update);
    } else {
      console.log('Unsupported update type:', JSON.stringify(update, null, 2));
    }

    return json({ ok: true });

  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    console.error('Webhook error:', err);
    throw error(500, 'Internal server error');
  }
};

// Reject non-POST requests
export const GET: RequestHandler = () => {
  throw error(405, 'Method not allowed');
};

export const PUT: RequestHandler = () => {
  throw error(405, 'Method not allowed');
};

export const DELETE: RequestHandler = () => {
  throw error(405, 'Method not allowed');
};

export const PATCH: RequestHandler = () => {
  throw error(405, 'Method not allowed');
};