/*
 * ラベル欄の幅・綴りと、その幅から決まる字下げ。1 prop の行・束ねた行・インスタンスの節の
 * 3 つが同じ値を前提にしているので、どれか 1 つに持たせず 1 箇所へ置く。
 */

/**
 * ラベル欄の幅。UI 案の 52px では `Width Mode` / `Height Mode` が収まらない。
 * 変えたら `ControlOffsetClass` も一緒に動かす（片方だけ変えると字下げがずれる）。
 */
export const LabelWidthClass = "w-[5.25rem] shrink-0";

/**
 * ラベル欄の右、コントロールの左端へ揃えるための字下げ。
 * ラベル欄 5.25rem + ラベルとコントロールの間隔 0.5rem。
 */
export const ControlOffsetClass = "pl-[5.75rem]";

/** ラベル欄の綴り。幅・字下げと揃えて動かせるよう、行ごとに書かずここへ置く。 */
export const LabelClass = `${LabelWidthClass} truncate text-[11px] text-gray-500`;
