//! 同じファイルを指す別の綴りを、1 つの綴りへ寄せる。
//!
//! 寄せた綴りは `KnownContentRegistry` の記録のキーと、TS がタブ・最近使ったファイルを
//! 見分けるのに使う綴り(`canonicalize_document_path`)の両方に使う。

use std::path::{Component, Path, PathBuf, Prefix};

use super::file_path::DocumentFilePath;
use super::io::DocumentIoError;

/// `path` が指すファイルの綴りを、同じファイルを指す綴りどうしで 1 つに揃える。
///
/// `./doc.dcmp` と `doc.dcmp`、symlink 経由と実体のように、同じファイルを指す
/// 異なる表記を同じ綴りにする。
///
/// @returns 揃えた綴り。親ディレクトリも正規化できないときは `path` の綴りのまま
pub fn canonical_form(path: &Path) -> PathBuf {
    if let Ok(canonical) = path.canonicalize() {
        return without_verbatim_disk(canonical);
    }

    // ファイルがまだ存在しない場合は canonicalize できない。新規ファイルへの
    // `record_write` は書き込み前に記録するのでここを通り、書き込み後の問い合わせは
    // 上の分岐を通る。両者が同じキーになるよう、親ディレクトリだけを正規化して組み立てる。
    let (Some(parent), Some(file_name)) = (path.parent(), path.file_name()) else {
        return path.to_path_buf();
    };
    let parent = if parent.as_os_str().is_empty() {
        Path::new(".")
    } else {
        parent
    };
    match parent.canonicalize() {
        Ok(directory) => without_verbatim_disk(directory).join(file_name),
        Err(_) => path.to_path_buf(),
    }
}

/// Windows の `canonicalize` がドライブに付ける `\\?\C:` を `C:` に戻す。UNC
/// (`\\?\UNC\server\share`)はそのまま返す。
///
/// 揃えた綴りは TS へ返り、最近使ったファイルとして `app-state.json` に残るので、
/// 接頭辞の無い形にしておく。
///
/// CI は cargo test を走らせない(`.github/workflows/frontend.yml`)ので、Windows / macOS
/// だけを通る分岐は実機で確かめていない。
fn without_verbatim_disk(path: PathBuf) -> PathBuf {
    let mut components = path.components();
    let Some(Component::Prefix(prefix)) = components.next() else {
        return path;
    };
    let Prefix::VerbatimDisk(drive) = prefix.kind() else {
        return path;
    };
    let rest: PathBuf = components.collect();
    PathBuf::from(format!("{}:", char::from(drive))).join(rest)
}

/// webview から渡されたパスを検査し、`canonical_form` で揃えた綴りを返す。
///
/// 揃えた綴りも検査し直すので、実体が `.dcmp` でない symlink はここで拒む。
///
/// @returns 揃えた綴り。渡されたパスか揃えた綴りが検査を通らないとき、揃えた綴りが
/// UTF-8 で表せないときは `InvalidPath`
pub fn canonicalize_requested(raw_path: &str) -> Result<DocumentFilePath, DocumentIoError> {
    let requested = DocumentFilePath::parse(raw_path)?;
    let canonical = canonical_form(&requested);
    let spelled = canonical
        .to_str()
        .ok_or_else(|| DocumentIoError::invalid_path(&canonical, "UTF-8 で表せない"))?;
    DocumentFilePath::parse(spelled)
}

// 起動時の復元は最近使ったファイルの全行を寄せる。同期コマンドはメインスレッドで動き、
// 応答しないネットワークドライブの realpath で UI が固まりうるので、async で別スレッドへ出す。
#[tauri::command(async)]
pub fn canonicalize_document_path(path: String) -> Result<String, DocumentIoError> {
    canonicalize_requested(&path).map(|canonical| canonical.to_string_lossy().into_owned())
}
