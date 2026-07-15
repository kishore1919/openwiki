/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Markdown renderer for assistant messages. Uses `marked` to lex block/inline
 * tokens (replacing OpenWiki's old `MarkdownText`) and `highlight.js` for code
 * blocks, mapping hljs classes onto the active theme's palette. gemini-cli's
 * full `MarkdownDisplay` uses `lowlight` + a hast->Ink converter; this is the
 * OpenWiki-adapted equivalent (highlight.js HTML -> Ink segments).
 */

import type { ReactNode } from "react";
import { Box, Text } from "ink";
import { marked, type Tokens } from "marked";
import hljs from "highlight.js";
import { Colors } from "../colors.js";

const HLJS_COLOR: Record<string, string> = {
  keyword: Colors.AccentBlue,
  literal: Colors.AccentBlue,
  symbol: Colors.AccentBlue,
  name: Colors.AccentBlue,
  link: Colors.AccentBlue,
  built_in: Colors.LightBlue,
  type: Colors.LightBlue,
  attr: Colors.LightBlue,
  attribute: Colors.LightBlue,
  "builtin-name": Colors.LightBlue,
  string: Colors.AccentYellow,
  "meta-string": Colors.AccentYellow,
  regexp: Colors.AccentRed,
  "template-tag": Colors.AccentYellow,
  addition: Colors.AccentYellow,
  number: Colors.AccentGreen,
  class: Colors.AccentGreen,
  meta: Colors.Comment,
  comment: Colors.Comment,
  quote: Colors.Comment,
  doctag: Colors.Comment,
  "meta-keyword": Colors.Comment,
  tag: Colors.Comment,
  variable: Colors.AccentPurple,
  "template-variable": Colors.AccentPurple,
  section: Colors.AccentPurple,
  "selector-tag": Colors.AccentPurple,
  "selector-id": Colors.AccentPurple,
  "selector-class": Colors.AccentPurple,
  function: Colors.Foreground,
  title: Colors.Foreground,
  params: Colors.Foreground,
  formula: Colors.Foreground,
  deletion: Colors.AccentRed,
};

function decodeHtml(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
}

function highlightToSegments(code: string, lang?: string): ReactNode[] {
  let html: string;
  try {
    html =
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
  } catch {
    html = code;
  }

  const segments: ReactNode[] = [];
  const regex = /<span class="hljs-([a-z-]+)">([\s\S]*?)<\/span>|([^<]+)/g;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(html)) !== null) {
    if (match[3] !== undefined) {
      segments.push(<Text key={key++}>{decodeHtml(match[3])}</Text>);
    } else {
      const color = HLJS_COLOR[match[1]] ?? Colors.Foreground;
      segments.push(
        <Text key={key++} color={color}>
          {decodeHtml(match[2])}
        </Text>,
      );
    }
  }
  return segments;
}

function renderInline(tokens: Tokens.Generic[] | undefined): ReactNode[] {
  if (!tokens) {
    return [];
  }
  const out: ReactNode[] = [];
  let key = 0;
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        out.push(<Text key={key++}>{token.text}</Text>);
        break;
      case "strong":
        out.push(
          <Text key={key++} bold>
            {renderInline((token as Tokens.Strong).tokens)}
          </Text>,
        );
        break;
      case "em":
        out.push(
          <Text key={key++} italic>
            {renderInline((token as Tokens.Em).tokens)}
          </Text>,
        );
        break;
      case "codespan":
        out.push(
          <Text key={key++} color={Colors.AccentCyan}>
            {token.text}
          </Text>,
        );
        break;
      case "link":
        out.push(
          <Text key={key++} color={Colors.AccentBlue} underline>
            {renderInline((token as Tokens.Link).tokens)}
          </Text>,
        );
        break;
      case "br":
        out.push("\n");
        break;
      default:
        out.push(<Text key={key++}>{token.raw ?? ""}</Text>);
    }
  }
  return out;
}

export function MarkdownDisplay({ text }: { text: string }) {
  const tokens = marked.lexer(text);
  const blocks: ReactNode[] = [];
  let key = 0;

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const depth = (token as Tokens.Heading).depth;
        blocks.push(
          <Text key={key++} bold color={depth <= 2 ? Colors.AccentBlue : Colors.Foreground}>
            {"#".repeat(depth)} {renderInline((token as Tokens.Heading).tokens)}
          </Text>,
        );
        break;
      }
      case "paragraph":
        blocks.push(
          <Text key={key++} wrap="wrap">
            {renderInline((token as Tokens.Paragraph).tokens)}
          </Text>,
        );
        break;
      case "code": {
        const codeToken = token as Tokens.Code;
        const lang = codeToken.lang?.trim();
        blocks.push(
          <Box
            key={key++}
            flexDirection="column"
            borderStyle="round"
            borderColor={Colors.DarkGray}
            paddingX={1}
          >
            {lang ? (
              <Text color={Colors.Comment}>{lang}</Text>
            ) : null}
            <Text wrap="wrap">{highlightToSegments(codeToken.text, lang)}</Text>
          </Box>,
        );
        break;
      }
      case "list": {
        const list = token as Tokens.List;
        list.items.forEach((item, index) => {
          blocks.push(
            <Box key={key++} flexDirection="row">
              <Text color={Colors.Gray}>{list.ordered ? `${index + 1}.` : "•"} </Text>
              <Text wrap="wrap">{renderInline(item.tokens)}</Text>
            </Box>,
          );
        });
        break;
      }
      case "blockquote":
        blocks.push(
          <Box key={key++} paddingLeft={2} borderStyle="single" borderLeft>
            <Text color={Colors.Gray} wrap="wrap">
              {renderInline((token as Tokens.Blockquote).tokens)}
            </Text>
          </Box>,
        );
        break;
      case "hr":
        blocks.push(<Text key={key++} color={Colors.DarkGray}>{"─".repeat(20)}</Text>);
        break;
      case "space":
        break;
      default:
        blocks.push(
          <Text key={key++} wrap="wrap">
            {renderInline((token as Tokens.Generic).tokens)}
          </Text>,
        );
    }
  }

  return <Box flexDirection="column">{blocks}</Box>;
}
