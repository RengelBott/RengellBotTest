import generateWAMessageFromContent from '@whiskeysockets/baileys';
import * as fs from 'fs';

let handler = async (m, { conn, text, participants, isOwner, isAdmin }) => {
  // Verificar si hay texto o un mensaje citado
  if (!m.quoted && !text) return m.reply(`⚠️ Debes escribir un mensaje o responder a uno existente.`);

  try { 
    let users = participants.map(u => conn.decodeJid(u.id));
    let mensajeTexto = text || (m.quoted && m.quoted.text) || 'Aviso!';
    
    // Si hay un mensaje citado, replicar el contenido con mención
    let q = m.quoted ? m.quoted : m;
    let c = m.quoted ? await m.getQuotedObj() : m.msg || { text: mensajeTexto };
    
    let msg = conn.cMod(
      m.chat,
      generateWAMessageFromContent(
        m.chat,
        { [m.quoted ? q.mtype : 'extendedTextMessage']: m.quoted ? c.message[q.mtype] : { text: mensajeTexto }},
        { quoted: m, userJid: conn.user.id }
      ),
      mensajeTexto, 
      conn.user.jid, 
      { mentions: users }
    );
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

  } catch (error) {  
    console.error(error);
    // En caso de error, usa un método alternativo
    let users = participants.map(u => conn.decodeJid(u.id));
    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || '';
    let isMedia = /image|video|sticker|audio/.test(mime);
    let mensajeTexto = text || (quoted.text) || "*Aviso!*";
    
    if (isMedia && quoted.mtype === 'imageMessage') {
      var mediax = await quoted.download?.();
      conn.sendMessage(m.chat, { image: mediax, mentions: users, caption: mensajeTexto }, { quoted: m });
    } else if (isMedia && quoted.mtype === 'videoMessage') {
      var mediax = await quoted.download?.();
      conn.sendMessage(m.chat, { video: mediax, mentions: users, caption: mensajeTexto, mimetype: 'video/mp4' }, { quoted: m });
    } else if (isMedia && quoted.mtype === 'audioMessage') {
      var mediax = await quoted.download?.();
      conn.sendMessage(m.chat, { audio: mediax, mentions: users, mimetype: 'audio/mp4', fileName: `Notificacion.mp3` }, { quoted: m });
    } else if (isMedia && quoted.mtype === 'stickerMessage') {
      var mediax = await quoted.download?.();
      conn.sendMessage(m.chat, { sticker: mediax, mentions: users }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, { text: mensajeTexto, mentions: users }, { quoted: m });
    }
  }
};

// Configuración para funcionar solo con prefijo
handler.command = /^(hidetag|notificar|noti|notify|mensaje|tag|n)$/i;

handler.group = true;
handler.admin = true;

export default handler;
