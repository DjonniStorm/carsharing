/** Обёртка для HTML-писем: инлайн-стили, узкая колонка по центру. */
export function wrapNotificationEmail(bodyInnerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title></title>
</head>
<body style="margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.5;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;font-size:13px;font-weight:600;letter-spacing:.04em;color:#71717a;text-transform:uppercase;">Carsharing</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              ${bodyInnerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;">
              Это автоматическое сообщение, отвечать не нужно.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
