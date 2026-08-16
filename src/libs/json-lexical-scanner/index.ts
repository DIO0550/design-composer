import { StringEx } from "@/utils/StringEx";

/** 字句スキャンで見つかる不正。JSON.parse では分からないキーの重複を含む。 */
export type JsonScanErrorKind = "syntax-error" | "duplicate-key";

/** 不正 1 件。テキストの何文字目かを持つ（画面はここを指す）。 */
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

const EscapeMap: Readonly<Record<string, string>> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

const NumberPattern = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/;
const Literals = ["true", "false", "null"] as const;

/**
 * そこまで読めたことを表す結果。集めたエラーは読み進めたまま持ち回る。
 *
 * @param position 次に読む位置
 * @param errors ここまでに集めたエラー（読み進められた場合も空とは限らない）
 * @returns 成功を表す結果
 */
function ok(
  position: number,
  errors: readonly JsonScanError[] = [],
): ScanOutcome {
  return { ok: true, position, errors };
}

/**
 * 文字列を読めたことを表す結果。復元した中身をキーの重複判定に使う。
 *
 * @param position 閉じ引用符の次の位置
 * @param value エスケープを解いた中身
 * @param errors ここまでに集めたエラー
 * @returns 成功を表す結果
 */
function okString(
  position: number,
  value: string,
  errors: readonly JsonScanError[] = [],
): StringScanOutcome {
  return { ok: true, position, value, errors };
}

/**
 * そこで読み進められなくなったことを表す結果。
 *
 * @param position 読み進められなくなった位置
 * @param errors そこまでに集めたエラーと、打ち切りの理由
 * @returns 失敗を表す結果
 */
function fail(position: number, errors: readonly JsonScanError[]): ScanFailure {
  return { ok: false, position, errors };
}

/**
 * 空白を読み飛ばした次の位置。
 *
 * @param text 読んでいる全文
 * @param position 読み始める位置
 * @returns 空白でない最初の文字の位置（末尾まで空白なら `text.length`）
 */
function skipWhitespace(text: string, position: number): number {
  let pos = position;
  while (pos < text.length && StringEx.isWhitespace(text[pos])) {
    pos += 1;
  }
  return pos;
}

/**
 * `\uXXXX` を読み、表す 1 文字を返す。桁が足りなければ失敗。
 *
 * @param text 読んでいる全文
 * @param uCharPos `u` の位置
 * @param escapePos `\` の位置（エラーの位置として報告する）
 * @returns 復元した 1 文字と次の位置。16 進 4 桁でなければ失敗
 */
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

/**
 * `\` から始まる 1 つのエスケープを読む。
 *
 * @param text 読んでいる全文
 * @param position `\` の位置
 * @returns 復元した 1 文字と次の位置。未定義のエスケープなら失敗
 */
function scanEscapeSequence(text: string, position: number): StringScanOutcome {
  const escapePos = position;
  const escCharPos = position + 1;
  const esc = text[escCharPos];
  if (esc === "u") {
    return scanUnicodeEscape(text, escCharPos, escapePos);
  }
  const mapped = esc === undefined ? undefined : EscapeMap[esc];
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

/**
 * 二重引用符で囲まれた文字列を読み、エスケープを解いた中身を返す。
 *
 * @param text 読んでいる全文
 * @param position 開き引用符の位置
 * @returns 中身と閉じ引用符の次の位置。閉じられていない場合と、
 *   生の制御文字が入っていた場合は失敗
 */
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

/**
 * JSON の数値を読む。前置の `+` や先頭の `0` の連なりは受け付けない。
 *
 * @param text 読んでいる全文
 * @param position 数値の先頭の位置
 * @returns 数値の次の位置。JSON の数値として読めなければ失敗
 */
function scanNumber(text: string, position: number): ScanOutcome {
  const match = NumberPattern.exec(text.slice(position));
  if (match === null || match[0].length === 0) {
    return fail(position, [
      { kind: "syntax-error", message: "invalid number", position },
    ]);
  }
  return ok(position + match[0].length);
}

/**
 * `true` / `false` / `null` を読む。どれでもなければ `null`。
 *
 * @param text 読んでいる全文
 * @param position リテラルの先頭の位置
 * @returns リテラルの次の位置。どのリテラルでもなければ `null`
 */
function scanLiteral(text: string, position: number): number | null {
  for (const literal of Literals) {
    if (text.startsWith(literal, position)) {
      return position + literal.length;
    }
  }
  return null;
}

/**
 * オブジェクトを読む。同じキーが 2 度出たらエラーに足して読み進める。
 *
 * @param text 読んでいる全文
 * @param position `{` の位置
 * @returns `}` の次の位置と、重複キーを含む集めたエラー。
 *   構文として読み進められなくなった場合は失敗
 */
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

/**
 * 配列を読む。
 *
 * @param text 読んでいる全文
 * @param position `[` の位置
 * @returns `]` の次の位置と、集めたエラー。
 *   構文として読み進められなくなった場合は失敗
 */
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

/**
 * 位置にある値を種類で振り分けて読む。
 *
 * @param text 読んでいる全文
 * @param position 値の先頭の位置（前置の空白は読み飛ばす）
 * @returns 値の次の位置と、集めたエラー。
 *   入力が尽きた場合とどの種類でもない場合は失敗
 */
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

/**
 * JSON のテキストを字句として走査する（docs/01-file-format.md）。
 * `JSON.parse` が捨ててしまうキーの重複と、失敗した文字位置を取り出すために使う。
 */
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
