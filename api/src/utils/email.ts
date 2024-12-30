import sgMail from '@sendgrid/mail';

import { SENDGRID_API_KEY } from '../constants.js';

export function sendEmail(from: string, to: string, subject: string, text: string) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = { to, from, subject, text };
    return sgMail.send(msg);
}
