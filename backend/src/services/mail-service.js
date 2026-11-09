const nodemailer = require("nodemailer");
const env = require("../config/env");

function isConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.MAIL_FROM);
}

let transporter;
function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      requireTLS: !env.SMTP_SECURE,
    });
  }
  return transporter;
}

async function sendPasswordResetCode({ to, name, code }) {
  const mailer = getTransporter();
  if (!mailer) return false;
  await mailer.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Código para redefinir sua senha · LearnHub",
    text: `Olá, ${name}.\n\nSeu código de recuperação do LearnHub é ${code}.\nEle expira em 30 minutos e pode ser usado uma única vez.\n\nSe você não solicitou a recuperação, ignore esta mensagem.`,
    html: `<p>Olá, <strong>${String(name).replace(/[<>&"]/g, "")}</strong>.</p><p>Seu código de recuperação do LearnHub é:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Ele expira em 30 minutos e pode ser usado uma única vez.</p><p>Se você não solicitou a recuperação, ignore esta mensagem.</p>`,
  });
  return true;
}

module.exports = { isConfigured, sendPasswordResetCode };
