import type { Canvas, CanvasSection } from "../canvas/types.js";

interface TeamsAdaptiveCardBlock {
  type: string;
  text?: string;
  weight?: string;
  separator?: boolean;
  [key: string]: unknown;
}

interface TeamsAdaptiveCard {
  $schema: string;
  type: string;
  version: string;
  body: TeamsAdaptiveCardBlock[];
  actions?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
}

export function canvasToTeamsAdaptiveCard(canvas: Canvas): TeamsAdaptiveCard {
  const body: TeamsAdaptiveCardBlock[] = [
    {
      type: "TextBlock",
      text: canvas.title,
      weight: "bolder",
      size: "large",
    },
  ];

  if (canvas.description) {
    body.push({
      type: "TextBlock",
      text: canvas.description,
      wrap: true,
      separator: true,
    });
  }

  for (const section of canvas.sections) {
    body.push({
      type: "TextBlock",
      text: section.title,
      weight: "bolder",
      separator: true,
    });

    body.push({
      type: "TextBlock",
      text: section.content || "(empty)",
      wrap: true,
    });

    if (section.actions && section.actions.length > 0) {
      const actions = section.actions
        .filter((a) => a.url)
        .map((a) => ({
          type: "Action.OpenUrl",
          title: a.label,
          url: a.url!,
        }));

      if (actions.length > 0) {
        body.push({
          type: "ActionSet",
          actions,
        } as unknown as TeamsAdaptiveCardBlock);
      }
    }
  }

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body,
  };
}

export function sendTeamsCanvas(
  card: TeamsAdaptiveCard,
  channelSendMessage: (options: unknown) => Promise<void>,
): Promise<void> {
  return channelSendMessage({
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  });
}
