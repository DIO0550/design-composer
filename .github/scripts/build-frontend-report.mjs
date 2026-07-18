// frontend CI の PR コメント本文(Markdown)を生成する。
// 入力: 引数1 = frontend-coverage アーティファクトの展開ディレクトリ
//   - coverage/coverage-summary.json … 全体 + ファイル別カバレッジ
//   - coverage/coverage-final.json   … istanbul 形式(未カバー行の特定に使用)
//   - vitest-report.json             … テスト実行時間(ファイル別 / テスト別)
// 出力: 標準出力に Markdown。入力が欠けたセクションはその旨を表示して続行する。
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? ".";
const sha = (process.env.GITHUB_SHA ?? "").slice(0, 7);

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(join(dir, path), "utf8"));
  } catch {
    return null;
  }
};

const statusFor = (pct) => (pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴");
const pctStr = (pct) => `${pct.toFixed(2)}%`;
// 実行環境の絶対パス(/home/runner/work/... 等)を src/ からの相対に落とす
const relPath = (p) => p.replace(/^.*?(?=src\/)/, "");
const fmtMs = (ms) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;

// 連続する行番号を "3-9, 12" のような範囲表記へ畳む
const toRanges = (lineList) => {
  const lines = [...new Set(lineList)].sort((a, b) => a - b);
  const ranges = [];
  for (const line of lines) {
    const last = ranges[ranges.length - 1];
    if (last && line <= last[1] + 1) {
      last[1] = Math.max(last[1], line);
    } else {
      ranges.push([line, line]);
    }
  }
  return ranges.map(([s, e]) => (s === e ? `${s}` : `${s}-${e}`));
};

const out = [];
out.push("## Frontend CI Report");
out.push("");
out.push(`Commit: \`${sha}\` — 凡例: 🟢 ≥80 / 🟡 50-79 / 🔴 <50`);

// ---- カバレッジ全体 ---------------------------------------------------------
const summary = readJson("coverage/coverage-summary.json");
out.push("");
out.push("### カバレッジ (vitest)");
out.push("");
if (summary?.total) {
  out.push("| Status | Metric | Percentage |");
  out.push("| :---: | --- | ---: |");
  for (const [label, key] of [
    ["Lines", "lines"],
    ["Statements", "statements"],
    ["Functions", "functions"],
    ["Branches", "branches"],
  ]) {
    const pct = summary.total[key]?.pct ?? 0;
    out.push(`| ${statusFor(pct)} | ${label} | ${pctStr(pct)} |`);
  }
} else {
  out.push("🔴 カバレッジサマリが取得できませんでした。");
}

// ---- カバレッジが足りないファイル -------------------------------------------
const final = readJson("coverage/coverage-final.json");
// coverage-final.json から「ヒット 0 の statement が載っている行」を集める
const uncoveredLines = (absPath) => {
  const entry = final?.[absPath];
  if (!entry) {
    return [];
  }
  const lines = [];
  for (const [id, range] of Object.entries(entry.statementMap ?? {})) {
    if (entry.s?.[id] !== 0) {
      continue;
    }
    for (let l = range.start.line; l <= range.end.line; l++) {
      lines.push(l);
    }
  }
  return toRanges(lines);
};

if (summary) {
  const THRESHOLD = 80;
  const files = Object.entries(summary)
    .filter(([path]) => path !== "total")
    .map(([path, cov]) => ({ path, cov }))
    .filter(({ cov }) => (cov.lines?.pct ?? 100) < THRESHOLD)
    .sort((a, b) => (a.cov.lines?.pct ?? 0) - (b.cov.lines?.pct ?? 0));

  out.push("");
  out.push(`### カバレッジが足りないファイル (Lines < ${THRESHOLD}%)`);
  out.push("");
  if (files.length === 0) {
    out.push(`🎉 すべてのファイルが Lines ${THRESHOLD}% 以上です。`);
  } else {
    const LIMIT = 15;
    out.push("| Status | File | Lines | Branches | Functions | 未カバー行 |");
    out.push("| :---: | --- | ---: | ---: | ---: | --- |");
    for (const { path, cov } of files.slice(0, LIMIT)) {
      const lines = cov.lines?.pct ?? 0;
      const ranges = uncoveredLines(path);
      const shownRanges =
        ranges.length > 8
          ? `${ranges.slice(0, 8).join(", ")}, …(他 ${ranges.length - 8} 箇所)`
          : ranges.join(", ");
      out.push(
        `| ${statusFor(lines)} | \`${relPath(path)}\` | ${pctStr(lines)} ` +
          `| ${pctStr(cov.branches?.pct ?? 0)} | ${pctStr(cov.functions?.pct ?? 0)} ` +
          `| ${shownRanges || "-"} |`,
      );
    }
    if (files.length > LIMIT) {
      out.push("");
      out.push(`※ 他 ${files.length - LIMIT} ファイル(coverage アーティファクト参照)`);
    }
  }
}

// ---- テスト実行時間 ---------------------------------------------------------
const report = readJson("vitest-report.json");
out.push("");
out.push("### テスト実行時間 (vitest 計測)");
out.push("");
if (report?.testResults) {
  const fileTimes = report.testResults
    .map((r) => ({
      path: relPath(r.name),
      dur: r.endTime - r.startTime,
      tests: r.assertionResults?.length ?? 0,
    }))
    .sort((a, b) => b.dur - a.dur);
  const totalDur = fileTimes.reduce((acc, f) => acc + f.dur, 0);

  out.push(
    `テスト ${report.numTotalTests} 件 / ファイル ${report.numTotalTestSuites} 件` +
      ` / 合計 ${fmtMs(totalDur)}(ファイル実行時間の総和)`,
  );
  out.push("");
  out.push("**遅いテストファイル Top 5**");
  out.push("");
  out.push("| # | File | Tests | Duration |");
  out.push("| ---: | --- | ---: | ---: |");
  fileTimes.slice(0, 5).forEach((f, i) => {
    out.push(`| ${i + 1} | \`${f.path}\` | ${f.tests} | ${fmtMs(f.dur)} |`);
  });

  const tests = report.testResults
    .flatMap((r) =>
      (r.assertionResults ?? []).map((a) => ({
        path: relPath(r.name),
        title: a.title,
        dur: a.duration ?? 0,
      })),
    )
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 10);
  out.push("");
  out.push("<details><summary>遅いテスト Top 10 (個別)</summary>");
  out.push("");
  out.push("| # | Test | File | Duration |");
  out.push("| ---: | --- | --- | ---: |");
  tests.forEach((t, i) => {
    out.push(`| ${i + 1} | ${t.title} | \`${t.path}\` | ${fmtMs(t.dur)} |`);
  });
  out.push("");
  out.push("</details>");
} else {
  out.push("🔴 テストレポート(vitest-report.json)が取得できませんでした。");
}

process.stdout.write(`${out.join("\n")}\n`);
