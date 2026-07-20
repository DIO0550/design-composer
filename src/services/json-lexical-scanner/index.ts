export type JsonScanErrorKind = "syntax-error" | "duplicate-key";

export type JsonScanError = Readonly<{
  kind: JsonScanErrorKind;
  message: string;
  position: number;
}>;

type Cursor = { pos: number };

const ESCAPE_MAP: Readonly<Record<string, string>> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

const NUMBER_PATTERN = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/;

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function skipWhitespace(text: string, cursor: Cursor): void {
  while (cursor.pos < text.length && isWhitespace(text[cursor.pos])) {
    cursor.pos += 1;
  }
}

function scanUnicodeEscape(
  text: string,
  cursor: Cursor,
  escapePos: number,
  errors: JsonScanError[],
): string | null {
  const hex = text.slice(cursor.pos + 1, cursor.pos + 5);
  if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
    errors.push({
      kind: "syntax-error",
      message: "invalid unicode escape",
      position: escapePos,
    });
    return null;
  }
  cursor.pos += 5;
  return String.fromCharCode(Number.parseInt(hex, 16));
}

function scanEscapeSequence(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): string | null {
  const escapePos = cursor.pos;
  cursor.pos += 1;
  const esc = text[cursor.pos];
  if (esc === "u") {
    return scanUnicodeEscape(text, cursor, escapePos, errors);
  }
  const mapped = esc === undefined ? undefined : ESCAPE_MAP[esc];
  if (mapped === undefined) {
    errors.push({
      kind: "syntax-error",
      message: `invalid escape character "\\${esc ?? ""}"`,
      position: escapePos,
    });
    return null;
  }
  cursor.pos += 1;
  return mapped;
}

function scanString(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): string | null {
  const start = cursor.pos;
  cursor.pos += 1;
  let value = "";
  while (true) {
    if (cursor.pos >= text.length) {
      errors.push({
        kind: "syntax-error",
        message: "unterminated string",
        position: start,
      });
      return null;
    }
    const ch = text[cursor.pos];
    if (ch === '"') {
      cursor.pos += 1;
      return value;
    }
    if (ch === "\\") {
      const escaped = scanEscapeSequence(text, cursor, errors);
      if (escaped === null) {
        return null;
      }
      value += escaped;
      continue;
    }
    if (ch.charCodeAt(0) < 0x20) {
      errors.push({
        kind: "syntax-error",
        message: "unescaped control character in string",
        position: cursor.pos,
      });
      return null;
    }
    value += ch;
    cursor.pos += 1;
  }
}

function scanNumber(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): boolean {
  const match = NUMBER_PATTERN.exec(text.slice(cursor.pos));
  if (match === null || match[0].length === 0) {
    errors.push({
      kind: "syntax-error",
      message: "invalid number",
      position: cursor.pos,
    });
    return false;
  }
  cursor.pos += match[0].length;
  return true;
}

function scanLiteral(text: string, cursor: Cursor, literal: string): boolean {
  if (text.startsWith(literal, cursor.pos)) {
    cursor.pos += literal.length;
    return true;
  }
  return false;
}

function scanObject(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): boolean {
  cursor.pos += 1;
  skipWhitespace(text, cursor);
  if (text[cursor.pos] === "}") {
    cursor.pos += 1;
    return true;
  }

  const seenKeys = new Set<string>();
  while (true) {
    skipWhitespace(text, cursor);
    if (text[cursor.pos] !== '"') {
      errors.push({
        kind: "syntax-error",
        message: "expected string key",
        position: cursor.pos,
      });
      return false;
    }
    const keyStart = cursor.pos;
    const key = scanString(text, cursor, errors);
    if (key === null) {
      return false;
    }
    if (seenKeys.has(key)) {
      errors.push({
        kind: "duplicate-key",
        message: `duplicate key "${key}"`,
        position: keyStart,
      });
    } else {
      seenKeys.add(key);
    }

    skipWhitespace(text, cursor);
    if (text[cursor.pos] !== ":") {
      errors.push({
        kind: "syntax-error",
        message: "expected ':' after key",
        position: cursor.pos,
      });
      return false;
    }
    cursor.pos += 1;

    if (!scanValue(text, cursor, errors)) {
      return false;
    }

    skipWhitespace(text, cursor);
    const ch = text[cursor.pos];
    if (ch === ",") {
      cursor.pos += 1;
      continue;
    }
    if (ch === "}") {
      cursor.pos += 1;
      return true;
    }
    errors.push({
      kind: "syntax-error",
      message: "expected ',' or '}'",
      position: cursor.pos,
    });
    return false;
  }
}

function scanArray(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): boolean {
  cursor.pos += 1;
  skipWhitespace(text, cursor);
  if (text[cursor.pos] === "]") {
    cursor.pos += 1;
    return true;
  }

  while (true) {
    if (!scanValue(text, cursor, errors)) {
      return false;
    }
    skipWhitespace(text, cursor);
    const ch = text[cursor.pos];
    if (ch === ",") {
      cursor.pos += 1;
      continue;
    }
    if (ch === "]") {
      cursor.pos += 1;
      return true;
    }
    errors.push({
      kind: "syntax-error",
      message: "expected ',' or ']'",
      position: cursor.pos,
    });
    return false;
  }
}

function scanValue(
  text: string,
  cursor: Cursor,
  errors: JsonScanError[],
): boolean {
  skipWhitespace(text, cursor);
  if (cursor.pos >= text.length) {
    errors.push({
      kind: "syntax-error",
      message: "unexpected end of input",
      position: cursor.pos,
    });
    return false;
  }

  const ch = text[cursor.pos];
  if (ch === "{") {
    return scanObject(text, cursor, errors);
  }
  if (ch === "[") {
    return scanArray(text, cursor, errors);
  }
  if (ch === '"') {
    return scanString(text, cursor, errors) !== null;
  }
  if (ch === "-" || isDigit(ch)) {
    return scanNumber(text, cursor, errors);
  }
  if (scanLiteral(text, cursor, "true")) {
    return true;
  }
  if (scanLiteral(text, cursor, "false")) {
    return true;
  }
  if (scanLiteral(text, cursor, "null")) {
    return true;
  }

  errors.push({
    kind: "syntax-error",
    message: "unexpected token",
    position: cursor.pos,
  });
  return false;
}

export const JsonLexicalScanner = {
  scan(text: string): readonly JsonScanError[] {
    const cursor: Cursor = { pos: 0 };
    const errors: JsonScanError[] = [];

    if (!scanValue(text, cursor, errors)) {
      return errors;
    }

    skipWhitespace(text, cursor);
    if (cursor.pos < text.length) {
      errors.push({
        kind: "syntax-error",
        message: "unexpected trailing content",
        position: cursor.pos,
      });
    }
    return errors;
  },
} as const;
