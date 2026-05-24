import nodemailer from 'nodemailer';

const user = process.env.GMAIL_USER || 'nirusaki3@gmail.com';
const pass = process.env.GMAIL_PASS || process.env.GMAIl_PASS || 'lpwr agrm zkdy yxbd';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass,
  },
});

export const sendWelcomeEmail = async (to: string, email: string): Promise<boolean> => {
  try {
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
    console.error(error);
    return false;
  }
};

export const sendOtpEmail = async (to: string, otp: string): Promise<boolean> => {
  try {
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
    console.error(error);
    return false;
  }
};

export const sendLoginOtpEmail = async (to: string, otp: string): Promise<boolean> => {
  try {
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
    console.error(error);
    return false;
  }
};

