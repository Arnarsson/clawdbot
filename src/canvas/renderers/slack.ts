import { Canvas, CanvasSection } from "../types.js";

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export function renderSlackBlocks(canvas: Canvas): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: canvas.title,
      },
    },
  ];

  if (canvas.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: canvas.description,
      },
    });
  }

  canvas.sections.forEach((section: CanvasSection) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${section.title}*\n${section.content}`,
      },
    });
  });

  return blocks;
}
