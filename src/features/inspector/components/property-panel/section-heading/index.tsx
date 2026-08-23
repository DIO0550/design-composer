import type { ReactElement } from "react";

/**
 * 節の見出し。
 *
 * @returns 見出しと、右端に添えるものを並べた帯
 */
export function SectionHeading({
  children,
  trailing,
}: Readonly<{ children: string; trailing?: ReactElement }>): ReactElement {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-[11px] text-gray-900">{children}</h3>
      {trailing}
    </div>
  );
}
