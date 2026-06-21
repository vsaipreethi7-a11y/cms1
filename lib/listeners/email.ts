import Imap from 'imap';
import { simpleParser } from 'mailparser';

export function startEmailListener({ user, pass, host = 'imap.gmail.com', port = 993, tls = true }: any, processMessage: Function) {
  const imap = new Imap({
    user,
    password: pass,
    host,
    port,
    tls,
    tlsOptions: {
      rejectUnauthorized: false
    }
  });

  function openInbox(cb: any) {
    imap.openBox('INBOX', false, cb);
  }

  imap.once('ready', function () {
    openInbox(function (err: any, box: any) {
      if (err) throw err;

      console.log("📧 Email listener started...");

      imap.on('mail', function () {
        const fetch = imap.seq.fetch(box.messages.total + ':*', {
          bodies: '',
          struct: true
        });

        fetch.on('message', function (msg: any) {
          msg.on('body', function (stream: any) {
            simpleParser(stream, async (err: any, mail: any) => {

              if (err) return;

              const text = mail.text || "";
              console.log("Email Message:", text);

              let imageBuffer: Buffer | null = null;
              if (mail.attachments && mail.attachments.length > 0) {
                const attachment = mail.attachments[0];
                if (attachment.contentType.startsWith("image")) {
                  imageBuffer = attachment.content;
                  console.log("Image attachment detected");
                }
              }

              processMessage({
                source: 'email',
                text,
                imageBuffer
              });

            });
          });
        });
      });
    });
  });

  imap.connect();
}
