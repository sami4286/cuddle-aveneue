/* ════════════════════ FORM ENDPOINT ════════════════════
   The four forms on the site post here, and this sends the mail.

   They were written for Netlify, data-netlify="true", and the site
   is on Vercel, where that attribute means nothing and a POST to a
   static .html is a 405. Every submission made until now was lost.

   No dependencies: Vercel's Node runtime parses the body and provides
   global fetch, and Resend is a plain REST call.

   Two ways of sending, because they suit two different moments.

     WEB3FORMS_ACCESS_KEY   needs nothing but an email address. Web3Forms
                            relays to whatever address the key was made
                            with, so this works before anyone has access
                            to the domain's DNS.

     RESEND_API_KEY         needs the sending domain verified, which is a
                            DNS change. Mail then comes from the school's
                            own domain and no third party holds it.

   Resend wins if both are set, so the day the domain is verified you add
   one variable and nothing else changes, no code, no redeploy of the
   markup, and the Web3Forms key can be deleted whenever.

     INQUIRY_TO       where the mail lands   (default customerservice@)
     INQUIRY_FROM     the envelope sender, Resend only

   The function answers two kinds of caller. Scripted, it returns JSON
   and the page shows the result without reloading. Unscripted, a
   browser that just submitted a form, it redirects back to the page
   it came from with ?sent=1, so the forms work with JavaScript off.
   ======================================================== */

const TO   = process.env.INQUIRY_TO   || 'customerservice@cuddleavenue.org';
const FROM = process.env.INQUIRY_FROM || 'Cuddle Avenue website <forms@cuddleavenue.org>';

/* The form each submission came from, as a subject line worth reading
   in an inbox. An unknown name is not rejected, it is just labelled. */
const FORMS = {
  'contact':            'Message from the contact page',
  'enrollment-inquiry': 'Enrollment inquiry',
  'tour-request':       'Tour request',
  'tuition-inquiry':    'Tuition and assistance inquiry',
};

/* Field names in the order a person would want to read them, with the
   labels the forms themselves use. Anything not listed still gets
   through, under its own name, a new field on a form should reach the
   inbox whether or not anyone remembered to add it here. */
const LABELS = [
  ['parent-name',  'Name'],
  ['email',        'Email'],
  ['phone',        'Phone'],
  ['topic',        'About'],
  ['child-name',   'Child'],
  ['child-age',    'Child’s age'],
  ['child-dob',    'Date of birth'],
  ['program',      'Program'],
  ['location',     'Location'],
  ['schedule',     'Schedule'],
  ['start-date',   'Preferred start'],
  ['availability', 'Availability'],
  ['assistance',   'Assistance'],
  ['message',      'Message'],
];

const SKIP = new Set(['company', 'form-name']);

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  /* Normally the runtime has parsed this already. If it handed over a
     string, an unusual content-type, or a body it did not recognise, 
     read it rather than silently treating every field as missing. */
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = body.trim().startsWith('{')
        ? JSON.parse(body)
        : Object.fromEntries(new URLSearchParams(body));
    } catch (e) { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};
  const wantsJson = String(req.headers.accept || '').includes('application/json');

  const back = (ok, reason) => {
    if (wantsJson) {
      return res.status(ok ? 200 : (reason === 'config' ? 503 : 400))
                .json(ok ? { ok: true } : { ok: false, error: reason });
    }
    /* a plain form post: send them back to the page they came from */
    const ref = String(req.headers.referer || '/');
    const url = ref.split('#')[0].split('?')[0] + (ok ? '?sent=1' : '?sent=0');
    res.setHeader('Location', url);
    return res.status(303).end();
  };

  /* The honeypot is a field a person never sees and never fills. A bot
     that filled it is told the message was sent and nothing is sent,
     because an error teaches it which field to leave alone next time. */
  if (String(body.company || '').trim()) return back(true);

  const email = String(body.email || '').trim();
  const name  = String(body['parent-name'] || '').trim();
  if (!name)  return back(false, 'Please tell us your name.');
  if (String(body.phone || '').replace(/\D/g, '').replace(/^1/, '').length !== 10) return back(false, 'Please enter a 10-digit phone number.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return back(false, 'Please check the email address.');

  if (!process.env.RESEND_API_KEY && !process.env.WEB3FORMS_ACCESS_KEY) {
    /* Loud rather than quiet. A form that silently swallows an enquiry
       from a parent looking for a place is worse than one that says it
       is broken. */
    console.error('Neither RESEND_API_KEY nor WEB3FORMS_ACCESS_KEY is set, the submission was not sent.');
    return back(false, 'config');
  }

  const formName = String(body['form-name'] || '').trim();
  const subject  = FORMS[formName] || 'Website inquiry';

  const ordered = [];
  const seen = new Set(SKIP);
  for (const [key, label] of LABELS) {
    const v = String(body[key] ?? '').trim();
    seen.add(key);
    if (v) ordered.push([label, v]);
  }
  for (const key of Object.keys(body)) {
    if (seen.has(key)) continue;
    const v = String(body[key] ?? '').trim();
    if (v) ordered.push([key, v]);
  }

  const text = ordered.map(([l, v]) => l + ': ' + v).join('\n') +
    '\n\n--\nSent from the ' + (formName || 'website') + ' form.';
  const html = '<table cellpadding="6" style="font:15px/1.5 system-ui,sans-serif">' +
    ordered.map(([l, v]) =>
      '<tr><td style="color:#606F77;vertical-align:top"><strong>' + esc(l) +
      '</strong></td><td>' + esc(v).replace(/\n/g, '<br>') + '</td></tr>').join('') +
    '</table><p style="color:#606F77;font:13px system-ui,sans-serif">Sent from the ' +
    esc(formName || 'website') + ' form.</p>';

  const line = 'Cuddle Avenue: ' + subject;
  const replyTo = name ? `${name} <${email}>` : email;

  try {
    const r = process.env.RESEND_API_KEY
      ? await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM,
            to: [TO],
            /* so hitting reply in the inbox answers the parent, not the site */
            reply_to: replyTo,
            subject: line,
            text,
            html,
          }),
        })
      : await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: process.env.WEB3FORMS_ACCESS_KEY,
            subject: line,
            from_name: 'Cuddle Avenue website',
            replyto: replyTo,
            /* the fields as their own keys, so the relay lays them out
               rather than sending one blob of text */
            ...Object.fromEntries(ordered),
          }),
        });

    if (!r.ok) {
      console.error('The mail relay refused the message:', r.status, (await r.text()).slice(0, 300));
      return back(false, 'send');
    }
    /* Web3Forms answers 200 with {success:false} when the key is wrong */
    if (!process.env.RESEND_API_KEY) {
      const said = await r.json().catch(() => ({ success: true }));
      if (said && said.success === false) {
        console.error('Web3Forms rejected the key:', said.message);
        return back(false, 'send');
      }
    }
    return back(true);
  } catch (err) {
    console.error('Could not reach the mail relay:', err && err.message);
    return back(false, 'send');
  }
};
