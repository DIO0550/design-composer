// Rust の tauri クレートと npm の @tauri-apps/api が同じ major/minor かを検査する。
// 違えば exit 1。
//
// tauri build はこの 2 つの major/minor 一致を要求し、違うとコンパイルへ入る前に落ちる。
// ところが cargo を走らせる CI が 1 つも無いため、ずれても気づけるのは
// release-desktop がタグで走るときだけだった(#366 で実際に Release がバイナリ無しになった)。
// 突き合わせるのはバージョン文字列だけなので、防ぐのにビルドを回す必要は無い。
//
// Why not: プラグインの対(tauri-plugin-dialog ↔ @tauri-apps/plugin-dialog など)は見ない。
// tauri build が実際に弾くのは core のこの 1 対だけで、かつ tauri-plugin-fs のように
// Rust 側にしか居ないものがあり対応付けが 1 対 1 にならない。
import { readFileSync } from "node:fs";

const CargoLockPath = "src-tauri/Cargo.lock";
// pnpm-lock.yaml ではなく node_modules を読む。tauri CLI が見るのは実体のほうなので、
// install の結果とロックが食い違っていても実体を正とするほうが CLI の判定と一致する。
const ApiPackageJsonPath = "node_modules/@tauri-apps/api/package.json";
const CrateName = "tauri";

/**
 * 検査の失敗を報告してプロセスを終える。
 * @param message 標準エラーへ出す理由
 * @returns 戻らない(exit 1)
 */
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

/**
 * ファイルを読む。読めなければ検査の失敗として扱う。
 * @param path 読むファイルのパス
 * @param description 読めなかったときにパスと併せて出す、そのファイルの呼び名
 * @returns ファイルの中身(UTF-8)
 */
const readOrFail = (path, description) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return fail(`${description} を読めなかった: ${path}`);
  }
};

/**
 * Cargo.lock から指定したクレートの解決済みバージョンを取り出す。
 * cargo を呼ばずに読めるので、CI に Rust ツールチェーンが要らない。
 * @param lock Cargo.lock の中身
 * @param name 探すクレート名
 * @returns 見つかったバージョン。そのクレートが居なければ null
 */
const crateVersion = (lock, name) => {
  for (const block of lock.split("[[package]]")) {
    if (block.match(/^\s*name\s*=\s*"(.+)"\s*$/m)?.[1] !== name) {
      continue;
    }
    return block.match(/^\s*version\s*=\s*"(.+)"\s*$/m)?.[1] ?? null;
  }
  return null;
};

/**
 * バージョン文字列の major.minor を返す。
 * @param version `major.minor.patch` 形式のバージョン
 * @returns `major.minor`
 */
const majorMinor = (version) => version.split(".").slice(0, 2).join(".");

const crate = crateVersion(readOrFail(CargoLockPath, "Cargo.lock"), CrateName);
if (crate === null) {
  fail(`${CargoLockPath} に ${CrateName} クレートが見つからなかった`);
}

const api = JSON.parse(readOrFail(ApiPackageJsonPath, "@tauri-apps/api の package.json")).version;

if (majorMinor(crate) !== majorMinor(api)) {
  fail(
    [
      `tauri クレート (v${crate}) と @tauri-apps/api (v${api}) の major/minor が違う。`,
      "この状態で tauri build を走らせるとコンパイルへ入る前に失敗する。",
      "",
      "揃え方: 上げる側に合わせる。",
      `  pnpm update @tauri-apps/api @tauri-apps/cli   # npm 側を ${majorMinor(crate)} 系へ`,
      "  cargo update -p tauri --manifest-path src-tauri/Cargo.toml   # Rust 側を上げる場合",
    ].join("\n"),
  );
}

console.log(`tauri ${crate} / @tauri-apps/api ${api} — major/minor が一致している`);
