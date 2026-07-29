import { StringEx } from "@/utils/StringEx";

export type JsonScanErrorKind = "syntax-error" | "duplicate-key";

export type JsonScanError = Readonly<{
  kind: JsonScanErrorKind;
  message: string;
  position: number;
}>;

type ScanSuccess = Readonly<{
  ok: true;
  position: number;
  errors: readonly JsonScanError[];
}>;

type ScanFailure = Readonly<{
  ok: false;
  position: number;
  errors: readonly JsonScanError[];
}>;

type ScanOutcome = ScanSuccess | ScanFailure;

type StringScanSuccess = Readonly<{
  ok: true;
  position: number;
  value: string;
  errors: readonly JsonScanError[];
}>;

type StringScanOutcome = StringScanSuccess | ScanFailure;

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
const LITERALS = ["true", "false", "null"] as const;

function ok(
  position: number,
  errors: readonly JsonScanError[] = [],
): ScanOutcome {
  return { ok: true, position, errors };
}

function okString(
  position: number,
  value: string,
  errors: readonly JsonScanError[] = [],
): StringScanOutcome {
  return { ok: true, position, value, errors };
}

function fail(position: number, errors: readonly JsonScanError[]): ScanFailure {
  return { ok: false, position, errors };
}

function skipWhitespace(text: string, position: number): number {
  let pos = position;
  while (pos < text.length && StringEx.isWhitespace(text[pos])) {
    pos += 1;
  }
  return pos;
}

function scanUnicodeEscape(
  text: string,
  uCharPos: number,
  escapePos: number,
): StringScanOutcome {
  const hex = text.slice(uCharPos + 1, uCharPos + 5);
  if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
    return fail(uCharPos, [
      {
        kind: "syntax-error",
        message: "invalid unicode escape",
        position: escapePos,
      },
    ]);
  }
  return okString(uCharPos + 5, String.fromCharCode(Number.parseInt(hex, 16)));
}

function scanEscapeSequence(text: string, position: number): StringScanOutcome {
  const escapePos = position;
  const escCharPos = position + 1;
  const esc = text[escCharPos];
  if (esc === "u") {
    return scanUnicodeEscape(text, escCharPos, escapePos);
  }
  const mapped = esc === undefined ? undefined : ESCAPE_MAP[esc];
  if (mapped === undefined) {
    return fail(escCharPos, [
      {
        kind: "syntax-error",
        message: `invalid escape character "\\${esc ?? ""}"`,
        position: escapePos,
      },
    ]);
  }
  return okString(escCharPos + 1, mapped);
}

function scanString(text: string, position: number): StringScanOutcome {
  const start = position;
  let pos = position + 1;
  let value = "";
  let errors: readonly JsonScanError[] = [];

  while (true) {
    if (pos >= text.length) {
      return fail(pos, [
        ...errors,
        {
          kind: "syntax-error",
          message: "unterminated string",
          position: start,
        },
      ]);
    }
    const ch = text[pos];
    if (ch === '"') {
      return okString(pos + 1, value, errors);
    }
    if (ch === "\\") {
      const escapeResult = scanEscapeSequence(text, pos);
      errors = [...errors, ...escapeResult.errors];
      if (!escapeResult.ok) {
        return fail(escapeResult.position, errors);
      }
      value += escapeResult.value;
      pos = escapeResult.position;
      continue;
    }
    if (ch.charCodeAt(0) < 0x20) {
      return fail(pos, [
        ...errors,
        {
          kind: "syntax-error",
          message: "unescaped control character in string",
          position: pos,
        },
      ]);
    }
    value += ch;
    pos += 1;
  }
}

function scanNumber(text: string, position: number): ScanOutcome {
  const match = NUMBER_PATTERN.exec(text.slice(position));
  if (match === null || match[0].length === 0) {
    return fail(position, [
      { kind: "syntax-error", message: "invalid number", position },
    ]);
  }
  return ok(position + match[0].length);
}

function scanLiteral(text: string, position: number): number | null {
  for (const literal of LITERALS) {
    if (text.startsWith(literal, position)) {
      return position + literal.length;
    }
  }
  return null;
}

function scanObject(text: string, position: number): ScanOutcome {
  let pos = skipWhitespace(text, position + 1);
  if (text[pos] === "}") {
    return ok(pos + 1);
  }

  const seenKeys = new Set<string>();
  let errors: readonly JsonScanError[] = [];

  while (true) {
    pos = skipWhitespace(text, pos);
    if (text[pos] !== '"') {
      return fail(pos, [
        ...errors,
        { kind: "syntax-error", message: "expected string key", position: pos },
      ]);
    }

    const keyStart = pos;
    const keyResult = scanString(text, pos);
    errors = [...errors, ...keyResult.errors];
    if (!keyResult.ok) {
      return fail(keyResult.position, errors);
    }
    pos = keyResult.position;

    if (seenKeys.has(keyResult.value)) {
      errors = [
        ...errors,
        {
          kind: "duplicate-key",
          message: `duplicate key "${keyResult.value}"`,
          position: keyStart,
        },
      ];
    } else {
      seenKeys.add(keyResult.value);
    }

    pos = skipWhitespace(text, pos);
    if (text[pos] !== ":") {
      return fail(pos, [
        ...errors,
        {
          kind: "syntax-error",
          message: "expected ':' after key",
          position: pos,
        },
      ]);
    }
    pos += 1;

    const valueResult = scanValue(text, pos);
    errors = [...errors, ...valueResult.errors];
    if (!valueResult.ok) {
      return fail(valueResult.position, errors);
    }
    pos = valueResult.position;

    pos = skipWhitespace(text, pos);
    const ch = text[pos];
    if (ch === ",") {
      pos += 1;
      continue;
    }
    if (ch === "}") {
      return ok(pos + 1, errors);
    }
    return fail(pos, [
      ...errors,
      { kind: "syntax-error", message: "expected ',' or '}'", position: pos },
    ]);
  }
}

function scanArray(text: string, position: number): ScanOutcome {
  let pos = skipWhitespace(text, position + 1);
  if (text[pos] === "]") {
    return ok(pos + 1);
  }

  let errors: readonly JsonScanError[] = [];
  while (true) {
    const valueResult = scanValue(text, pos);
    errors = [...errors, ...valueResult.errors];
    if (!valueResult.ok) {
      return fail(valueResult.position, errors);
    }
    pos = valueResult.position;

    pos = skipWhitespace(text, pos);
    const ch = text[pos];
    if (ch === ",") {
      pos += 1;
      continue;
    }
    if (ch === "]") {
      return ok(pos + 1, errors);
    }
    return fail(pos, [
      ...errors,
      { kind: "syntax-error", message: "expected ',' or ']'", position: pos },
    ]);
  }
}

function scanValue(text: string, position: number): ScanOutcome {
  const pos = skipWhitespace(text, position);
  if (pos >= text.length) {
    return fail(pos, [
      {
        kind: "syntax-error",
        message: "unexpected end of input",
        position: pos,
      },
    ]);
  }

  const ch = text[pos];
  if (ch === "{") {
    return scanObject(text, pos);
  }
  if (ch === "[") {
    return scanArray(text, pos);
  }
  if (ch === '"') {
    const result = scanString(text, pos);
    return result.ok
      ? ok(result.position, result.errors)
      : fail(result.position, result.errors);
  }
  if (ch === "-" || StringEx.isDigit(ch)) {
    return scanNumber(text, pos);
  }

  const literalEnd = scanLiteral(text, pos);
  if (literalEnd !== null) {
    return ok(literalEnd);
  }

  return fail(pos, [
    { kind: "syntax-error", message: "unexpected token", position: pos },
  ]);
}

export const JsonLexicalScanner = {
  scan(text: string): readonly JsonScanError[] {
    const result = scanValue(text, 0);
    if (!result.ok) {
      return result.errors;
    }

    const pos = skipWhitespace(text, result.position);
    if (pos < text.length) {
      return [
        ...result.errors,
        {
          kind: "syntax-error",
          message: "unexpected trailing content",
          position: pos,
        },
      ];
    }
    return result.errors;
  },
} as const;
