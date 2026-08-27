import { type ReactElement, useState } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { Token, type TokenKind, type TokenRef } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  type TokenPreview,
  type TokenRow,
  TokenSection,
} from "@/features/tokens/domains/token-control";
import { SetEx } from "@/utils/SetEx";

/** 見本の枠。どの種別でも同じ幅を空けて、名前の左端を揃える。 */
const PreviewWidthPx = 20;

/**
 * 一覧のどの種別を開いているか。
 * どの枝を畳んでいるかは編集ではなく見え方なので、ドキュメントの状態には持たない。
 */
type OpenKinds = ReadonlySet<TokenKind>;

/**
 * 値の見本。値そのものは行の文字として出ているので、飾りとして読み上げから外す。
 *
 * @returns 種別に応じた見本（色見本 / 長さの帯 / 影 / 書体の見本）
 */
function PreviewSlot({
  preview,
}: Readonly<{ preview: TokenPreview }>): ReactElement {
  switch (preview.kind) {
    case "swatch":
      return <ColorSwatch color={preview.color} />;
    case "bar":
      return (
        <span
          aria-hidden="true"
          style={{ width: `${PreviewWidthPx}px` }}
          className="inline-flex h-3 shrink-0 items-center"
        >
          <span
            style={{ width: `${preview.widthPx}px` }}
            className="inline-block h-2.5 bg-gray-300"
          />
        </span>
      );
    case "shadow":
      return (
        <span
          aria-hidden="true"
          style={{ width: `${PreviewWidthPx}px` }}
          className="inline-flex h-3 shrink-0 items-center justify-center"
        >
          {/* 影は白地に落として見せる。影そのものが値なのでクラス名に固定できない。 */}
          <span
            style={{ boxShadow: preview.value }}
            className="inline-block size-2.5 rounded-[2px] bg-white"
          />
        </span>
      );
    case "letters":
      return (
        <span
          aria-hidden="true"
          style={{
            width: `${PreviewWidthPx}px`,
            fontWeight: preview.fontWeight,
            fontFamily: preview.fontFamily,
          }}
          className="inline-block shrink-0 text-[10px] text-gray-700 leading-3"
        >
          Aa
        </span>
      );
  }
}

/**
 * 一覧の 1 行。見本・名前・値を並べ、押すと編集対象になる。
 *
 * @returns 見本・名前・値を並べたボタン
 */
function TokenRowItem({
  row,
  selection,
  onSelect,
}: Readonly<{
  row: TokenRow;
  selection: TokenSelection;
  onSelect: (ref: TokenRef) => void;
}>): ReactElement {
  return (
    <button
      type="button"
      aria-current={TokenSelection.isSelected(selection, Token.ref(row.token))}
      onClick={() => onSelect(Token.ref(row.token))}
      className="flex w-full items-center gap-2 rounded py-1 pr-3 pl-6 text-xs hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-900"
    >
      <PreviewSlot preview={row.preview} />
      <span className="min-w-0 flex-1 truncate text-left">
        {row.token.name}
      </span>
      <span className="shrink-0 text-[10px] text-gray-400">
        {row.valueText}
      </span>
    </button>
  );
}

/**
 * 種別ごとの見出し。開閉と、その種別への追加を担う。
 *
 * @returns 開閉のボタンと、その種別への追加ボタンを並べた見出し
 */
function SectionHeading({
  section,
  isOpen,
  onToggle,
  onAdd,
}: Readonly<{
  section: TokenSection;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (kind: TokenKind) => void;
}>): ReactElement {
  const kind = section.kind;

  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex items-center gap-1.5 font-semibold text-gray-900 text-xs"
      >
        {/* 開閉の向きは aria-expanded が伝えるので、三角は飾りとして読み上げから外す。 */}
        <span aria-hidden="true" className="text-[9px] text-gray-400">
          {isOpen ? "▾" : "▸"}
        </span>
        <span>{kind}</span>
        <span className="font-normal text-[10px] text-gray-400">
          {section.rows.length}
        </span>
      </button>
      {/* 畳んだ節に足しても増えた行が見えないので、開いている節にだけ出す。 */}
      {isOpen ? (
        <button
          type="button"
          aria-label={`${kind} にトークンを追加`}
          onClick={() => onAdd(kind)}
          className="px-1 text-gray-500 text-sm hover:text-gray-900"
        >
          +
        </button>
      ) : null}
    </div>
  );
}

/**
 * トークン一覧（docs/06-ui.md「編集操作の一覧」の tokens 編集 / UI 案の Tokens タブ）。
 *
 * 出す中身は種別の走査だけで決まる（`TokenSection.forDocument`）ため、
 * ここには種別名で分岐するコードを置かない。
 *
 * @returns 種別ごとの見出しと、開いている種別の行を並べた一覧
 */
export function TokenList({
  selection,
  onSelectToken,
  onAddToken,
}: Readonly<{
  selection: TokenSelection;
  onSelectToken: (ref: TokenRef) => void;
  onAddToken: (kind: TokenKind) => void;
}>): ReactElement {
  const sections = TokenSection.forDocument(selection.document);
  /*
   * 開いた直後は最初の種別だけを開く（UI 案 docs/Design Composer.html の
   * tokens 状態が colors だけ開いた形）。
   */
  const [openKinds, setOpenKinds] = useState<OpenKinds>(
    () => new Set([sections[0].kind]),
  );

  return (
    <section aria-label="トークン一覧" className="flex flex-col">
      {sections.map((section) => {
        const isOpen = openKinds.has(section.kind);
        return (
          <div key={section.kind}>
            <SectionHeading
              section={section}
              isOpen={isOpen}
              onToggle={() =>
                setOpenKinds((current) => SetEx.toggle(current, section.kind))
              }
              onAdd={onAddToken}
            />
            {isOpen
              ? section.rows.map((row) => (
                  <TokenRowItem
                    key={row.token.name}
                    row={row}
                    selection={selection}
                    onSelect={onSelectToken}
                  />
                ))
              : null}
          </div>
        );
      })}
    </section>
  );
}
