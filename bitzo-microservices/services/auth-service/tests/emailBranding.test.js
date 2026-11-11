const fs = require("node:fs");
const {
  brandEmailOptions,
  brandTransporter,
} = require("../../../shared/emailBranding");

describe("email branding", () => {
  test("adds the inline VidBuxApp logo and updates legacy branding", () => {
    const result = brandEmailOptions({
      from: { name: "BharatPlay", address: "hello@example.com" },
      subject: "Welcome to BharatPlay",
      text: "Welcome to BharatPlay",
      html: "<html><body><p>Welcome to BharatPlay</p></body></html>",
      attachments: [{ filename: "report.pdf", content: "report" }],
    });

    expect(result.subject).toBe("Welcome to VidBuxApp");
    expect(result.text).toBe("Welcome to VidBuxApp");
    expect(result.from.name).toBe("VidBuxApp");
    expect(result.html).toContain('src="cid:vidbuxapp-logo"');
    expect(result.html).toContain("Welcome to VidBuxApp");
    expect(result.html).not.toContain("BharatPlay");
    expect(result.attachments).toHaveLength(2);
    expect(result.attachments[0].filename).toBe("report.pdf");
    expect(fs.existsSync(result.attachments[1].path)).toBe(true);
  });

  test("creates branded HTML for text-only mail and escapes its contents", () => {
    const result = brandEmailOptions({
      from: "hello@example.com",
      text: "BharatPlay <support>\nPlease reply",
    });

    expect(result.from).toEqual({
      name: "VidBuxApp",
      address: "hello@example.com",
    });
    expect(result.html).toContain("VidBuxApp &lt;support&gt;<br>Please reply");
    expect(result.html).toContain("cid:vidbuxapp-logo");
    expect(result.attachments).toHaveLength(1);
  });

  test("does not add a duplicate inline logo attachment", () => {
    const existingLogo = {
      filename: "logo.png",
      cid: "vidbuxapp-logo",
      content: Buffer.from("logo"),
    };
    const result = brandEmailOptions({
      text: "Hello",
      attachments: [existingLogo],
    });

    expect(result.attachments).toEqual([existingLogo]);
  });

  test("brands messages sent through a service transporter", async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: "test-message" });
    const transporter = brandTransporter({ sendMail });

    await expect(transporter.sendMail({ text: "Hello" })).resolves.toEqual({
      messageId: "test-message",
    });

    expect(sendMail.mock.calls[0][0].html).toContain("cid:vidbuxapp-logo");
  });
});
