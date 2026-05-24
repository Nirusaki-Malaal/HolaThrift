import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { getEnv } from '../config/env';
import { IntegrationConfigError } from './integrationError';

let cachedTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;
let cachedMailKey = '';

const getMailConfig = () => ({
  user: getEnv('GMAIL_USER') || 'nirusaki3@gmail.com',
  pass: getEnv('GMAIL_PASS') || getEnv('GMAIl_PASS'),
});

const getTransporter = (): { transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>; user: string } => {
  const config = getMailConfig();
  if (!config.user || !config.pass) {
    throw new IntegrationConfigError('Gmail credentials are not configured. Set GMAIL_USER and GMAIL_PASS.');
  }

  const mailKey = `${config.user}:${config.pass.length}`;
  if (!cachedTransporter || mailKey !== cachedMailKey) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    cachedMailKey = mailKey;
  }

  return { transporter: cachedTransporter, user: config.user };
};

const logMailError = (error: unknown): void => {
  if (error instanceof IntegrationConfigError) {
    console.warn(error.message);
    return;
  }
  console.error(error);
};

export const sendWelcomeEmail = async (to: string, email: string): Promise<boolean> => {
  try {
    const { transporter, user } = getTransporter();
    await transporter.sendMail({
      from: `"Hola Thrift" <${user}>`,
      to,
      subject: 'Welcome to Hola Thrift ARCHIVES! 🔥',
      html: `
        <div style="background-color: #050505; color: #e5e5e5; font-family: sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #333;">
          <h1 style="color: #ffffff; text-align: center; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0 0 20px 0;">
            HOLA<span style="color: #a855f7;">THRIFT</span>
          </h1>
          <p style="font-size: 16px; line-height: 1.5; color: #a3a3a3; text-align: center; margin: 0 0 20px 0;">
            Welcome to the premium Gen-Z vintage & streetwear archive.
          </p>
          <div style="background-color: #111111; padding: 25px; border-radius: 15px; border: 1px solid #222; text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; margin: 0; color: #a855f7; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
              Your Account Has Been Activated
            </p>
            <p style="font-size: 16px; margin: 10px 0 0 0; color: #ffffff; font-family: monospace;">
              ${email}
            </p>
          </div>
          <p style="font-size: 11px; color: #525252; text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
            © 2026 Hola Thrift. All rights reserved. Curated with ❤️ in India.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logMailError(error);
    return false;
  }
};

export const sendOtpEmail = async (to: string, otp: string): Promise<boolean> => {
  try {
    const { transporter, user } = getTransporter();
    await transporter.sendMail({
      from: `"Hola Thrift" <${user}>`,
      to,
      subject: `Verify your email: ${otp} - Hola Thrift ARCHIVES! 🔑`,
      html: `
        <div style="background-color: #050505; color: #e5e5e5; font-family: sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #333;">
          <h1 style="color: #ffffff; text-align: center; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0 0 20px 0;">
            HOLA<span style="color: #a855f7;">THRIFT</span>
          </h1>
          <p style="font-size: 16px; line-height: 1.5; color: #a3a3a3; text-align: center; margin: 0 0 20px 0;">
            Use the verification code below to activate your account.
          </p>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 15px; border: 1px solid #e5e5e5; text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; margin: 0; color: #a855f7; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
              Verification Code
            </p>
            <p style="font-size: 36px; margin: 15px 0 0 0; color: #000000; font-family: monospace; font-weight: 900; letter-spacing: 6px;">
              ${otp}
            </p>
          </div>
          <p style="font-size: 11px; color: #525252; text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
            This code expires in 10 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logMailError(error);
    return false;
  }
};

export const sendLoginOtpEmail = async (to: string, otp: string): Promise<boolean> => {
  try {
    const { transporter, user } = getTransporter();
    await transporter.sendMail({
      from: `"Hola Thrift" <${user}>`,
      to,
      subject: `Your Hola Thrift Security Code: ${otp} - 2-Step Login! 🔑`,
      html: `
        <div style="background-color: #050505; color: #e5e5e5; font-family: sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #333;">
          <h1 style="color: #ffffff; text-align: center; text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin: 0 0 20px 0;">
            HOLA<span style="color: #a855f7;">THRIFT</span>
          </h1>
          <p style="font-size: 16px; line-height: 1.5; color: #a3a3a3; text-align: center; margin: 0 0 20px 0;">
            We noticed you're signing in! Enter the security code below to complete your login.
          </p>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 15px; border: 1px solid #e5e5e5; text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; margin: 0; color: #a855f7; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
              Security Code
            </p>
            <p style="font-size: 36px; margin: 15px 0 0 0; color: #000000; font-family: monospace; font-weight: 900; letter-spacing: 6px;">
              ${otp}
            </p>
          </div>
          <p style="font-size: 11px; color: #525252; text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
            This code will expire in 10 minutes. If you didn't request this sign-in, please change your password.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logMailError(error);
    return false;
  }
};

interface InvoiceEmailOrder {
  transactionId: string;
  total: number;
  invoiceUrl?: string;
  shippingAddress?: {
    name?: string;
    email?: string;
  };
}

const escapeHtml = (value: unknown): string => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const sendOrderInvoiceEmail = async (to: string, order: InvoiceEmailOrder): Promise<boolean> => {
  if (!order.invoiceUrl) return false;

  try {
    const { transporter, user } = getTransporter();
    const customerName = order.shippingAddress?.name || 'Customer';

    await transporter.sendMail({
      from: `"Hola Thrift" <${user}>`,
      to,
      subject: `Invoice for your Hola Thrift order ${order.transactionId}`,
      html: `
        <div style="background-color: #f6f7fb; color: #111827; font-family: Arial, sans-serif; padding: 36px; max-width: 640px; margin: auto; border-radius: 20px; border: 1px solid #e5e7eb;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -1px; text-transform: uppercase;">
            HOLA<span style="color: #7c3aed;">THRIFT</span>
          </h1>
          <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hi ${escapeHtml(customerName)}, your order has been confirmed. Your professional invoice JPG is attached and can also be viewed from the button below.
          </p>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 22px; margin: 26px 0;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Order Reference</p>
            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 900;">${escapeHtml(order.transactionId)}</p>
            <p style="margin: 18px 0 8px 0; color: #6b7280; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Amount Paid</p>
            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 900;">INR ${Number(order.total || 0).toLocaleString('en-IN')}</p>
          </div>
          <a href="${escapeHtml(order.invoiceUrl)}" style="display: inline-block; background: #111827; color: #ffffff; padding: 14px 18px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
            View Invoice JPG
          </a>
          <p style="font-size: 11px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 18px;">
            Thank you for shopping at holathrift.in.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `hola-invoice-${order.transactionId}.jpg`,
          path: order.invoiceUrl,
          contentType: 'image/jpeg',
        },
      ],
    });
    return true;
  } catch (error) {
    logMailError(error);
    return false;
  }
};

export const sendCustomEmail = async (to: string, subject: string, message: string): Promise<boolean> => {
  try {
    const { transporter, user } = getTransporter();
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    await transporter.sendMail({
      from: `"Hola Thrift" <${user}>`,
      to,
      subject,
      html: `
        <div style="background-color: #f6f7fb; color: #111827; font-family: Arial, sans-serif; padding: 36px; max-width: 640px; margin: auto; border-radius: 20px; border: 1px solid #e5e7eb;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -1px; text-transform: uppercase;">
            HOLA<span style="color: #7c3aed;">THRIFT</span>
          </h1>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin: 26px 0; color: #374151; font-size: 15px; line-height: 1.7;">
            ${safeMessage}
          </div>
          <p style="font-size: 11px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 18px;">
            Sent by Hola Thrift. Visit holathrift.in for your account and orders.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logMailError(error);
    return false;
  }
};
