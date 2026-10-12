/**
 * キーボードで辿ったときに、押せる部品の外側へ描くフォーカス枠（青の 2px）を指定する Tailwind のクラス。
 *
 * 枠の青（`#0a74c9`）は UI 案（docs/Design Composer.html）の語彙に無く、意図して離れている（#1062）。
 */
export const FocusOutlineClass =
  "focus-visible:outline-2 focus-visible:outline-[#0a74c9] focus-visible:outline-offset-2";
