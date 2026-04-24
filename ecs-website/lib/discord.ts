type WebhookPayload =
  | { type: "scrim"; data: { title: string; scheduledAt: Date; format: string; prizePool?: string | null; description?: string | null } }
  | { type: "result"; data: { scrim: { title: string }; homeTeam: { name: string; tag: string }; awayTeam: { name: string; tag: string }; homeScore: number; awayScore: number; mvp?: string | null; vodUrl?: string | null } };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(date));
}

export async function sendDiscordWebhook(payload: WebhookPayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let body: object;

  if (payload.type === "scrim") {
    const { title, scheduledAt, format, prizePool, description } = payload.data;
    body = {
      embeds: [
        {
          title: `📅 New Scrim Announced: ${title}`,
          description: description ?? "A new ECS scrim has been scheduled.",
          color: 0xf5a623,
          fields: [
            { name: "Date & Time", value: `${formatDate(scheduledAt)} SAST`, inline: true },
            { name: "Format", value: format, inline: true },
            ...(prizePool ? [{ name: "Prize Pool", value: prizePool, inline: true }] : []),
          ],
          footer: { text: "Elite Community Scrims · COD Mobile BR" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } else {
    const { scrim, homeTeam, awayTeam, homeScore, awayScore, mvp, vodUrl } = payload.data;
    const winner =
      homeScore > awayScore ? homeTeam.name : awayScore > homeScore ? awayTeam.name : "Draw";
    body = {
      embeds: [
        {
          title: `🏆 Match Result: ${scrim.title}`,
          color: 0x4caf50,
          fields: [
            {
              name: "Score",
              value: `**[${homeTeam.tag}] ${homeTeam.name}** ${homeScore} — ${awayScore} **[${awayTeam.tag}] ${awayTeam.name}**`,
            },
            { name: "Winner", value: winner, inline: true },
            ...(mvp ? [{ name: "MVP", value: mvp, inline: true }] : []),
            ...(vodUrl ? [{ name: "VOD", value: vodUrl }] : []),
          ],
          footer: { text: "Elite Community Scrims · COD Mobile BR" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
