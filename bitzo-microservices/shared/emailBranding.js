const path = require("node:path");

const LOGO_CID = "vidbuxapp-logo";
const LOGO_PATH = path.join(__dirname, "assets", "VidBuxApp-logo.png");

const replaceBrand = (value) =>
  typeof value === "string"
    ? value.replace(/\bBharatPlay\b/gi, "VidBuxApp")
    : value;

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const emailHeader = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
  <tr><td align="center" style="padding:24px 16px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;">
      <tr><td align="center" style="padding:18px 16px 14px;border-top:5px solid #e84b4b;border-bottom:1px solid #edf0f5;">
        <img src="cid:${LOGO_CID}" alt="VidBuxApp logo" width="140" style="display:block;width:140px;max-width:100%;height:auto;margin:0 auto 6px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;letter-spacing:1px;color:#172033;">VidBuxApp</div>
        <div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#788398;">Your video community</div>
      </td></tr>
    </table>
  </td></tr>
</table>`;

const emailFooter = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
  <tr><td align="center" style="padding:20px 16px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#788398;">
    &copy; ${new Date().getFullYear()} VidBuxApp
  </td></tr>
</table>`;

const addEmailLayout = (html) => {
  let brandedHtml = replaceBrand(html);

  if (/<body\b[^>]*>/i.test(brandedHtml)) {
    brandedHtml = brandedHtml.replace(/<body\b[^>]*>/i, (openingTag) =>
      `${openingTag}${emailHeader}`,
    );
    if (/<\/body\s*>/i.test(brandedHtml)) {
      brandedHtml = brandedHtml.replace(/<\/body\s*>/i, `${emailFooter}</body>`);
    } else {
      brandedHtml += emailFooter;
    }
    return brandedHtml;
  }

  return `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    ${emailHeader}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center" style="padding:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border-collapse:collapse;">
          <tr><td style="padding:24px;background:#ffffff;border:1px solid #edf0f5;border-radius:12px;">${brandedHtml}</td></tr>
        </table>
      </td></tr>
    </table>
    ${emailFooter}
  </body>
</html>`;
};

const brandAddress = (address) => {
  if (typeof address === "string") {
    const trimmedAddress = address.trim();
    if (/^[^@\s]+@[^@\s]+$/.test(trimmedAddress)) {
      return { name: "VidBuxApp", address: trimmedAddress };
    }
    return replaceBrand(address);
  }

  if (address && typeof address === "object" && !Array.isArray(address)) {
    return {
      ...address,
      name: replaceBrand(address.name || "VidBuxApp"),
    };
  }

  return address;
};

const brandEmailOptions = (options) => {
  if (!options || typeof options !== "object") return options;

  const brandedOptions = { ...options };
  brandedOptions.subject = replaceBrand(brandedOptions.subject);
  brandedOptions.text = replaceBrand(brandedOptions.text);

  if (Array.isArray(brandedOptions.from)) {
    brandedOptions.from = brandedOptions.from.map(brandAddress);
  } else if (brandedOptions.from) {
    brandedOptions.from = brandAddress(brandedOptions.from);
  }

  let html = brandedOptions.html;
  if (
    (html === undefined || html === null) &&
    typeof brandedOptions.text === "string"
  ) {
    html = escapeHtml(brandedOptions.text).replace(/\r\n|\r|\n/g, "<br>");
  }

  if (typeof html === "string") {
    brandedOptions.html = addEmailLayout(html);
    const attachments = Array.isArray(brandedOptions.attachments)
      ? [...brandedOptions.attachments]
      : brandedOptions.attachments
        ? [brandedOptions.attachments]
        : [];
    if (!attachments.some((attachment) => attachment?.cid === LOGO_CID)) {
      attachments.push({
        filename: "VidBuxApp-logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
        contentDisposition: "inline",
      });
    }
    brandedOptions.attachments = attachments;
  }

  return brandedOptions;
};

const brandTransporter = (transporter) => {
  const sendMail = transporter.sendMail.bind(transporter);
  transporter.sendMail = (options, callback) =>
    sendMail(brandEmailOptions(options), callback);
  return transporter;
};

module.exports = { brandEmailOptions, brandTransporter };
