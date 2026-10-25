use std::ffi::OsStr;
use std::ops::Deref;
use std::path::{Component, Path, PathBuf};

use super::io::DocumentIoError;

/// ドキュメントの 5 コマンドが扱ってよいと検査を通ったパス。
///
/// 拡張子が `.dcmp`(大文字小文字は問わない)の絶対パスで、`..` の要素を含まず、
/// ファイル名で終わり、ファイル名に `:` を含まないものだけを表す。
///
/// `Deserialize` は付けない。tauri はコマンド引数のデシリアライズ失敗を文字列の
/// `InvokeError` で返すため、TS 側で `invalidPath` ではなく `ipcFailed` に化ける。
/// 引数は `String` で受け、`parse` で `DocumentIoError` として拒否する。
///
/// 綴りは正規化せずに保つ。TS は `document-changed` の `path` を開いているパスと
/// 文字列で比べる(`use-document-reload/index.ts`)ので、綴りを変えると通知が届かなくなる。
/// 同じファイルの綴りを寄せるのは `canonical_path.rs` で、TS はその綴りで他の 4 コマンドを呼ぶ。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DocumentFilePath(PathBuf);

impl DocumentFilePath {
    /// webview から渡された文字列を検査し、ドキュメントのパスとして受け付ける。
    ///
    /// @returns 検査を通ったパス。通らないときは `InvalidPath`
    pub fn parse(raw: &str) -> Result<Self, DocumentIoError> {
        let path = Path::new(raw);
        if !path.is_absolute() {
            return Err(DocumentIoError::invalid_path(path, "絶対パスではない"));
        }
        if path
            .components()
            .any(|component| component == Component::ParentDir)
        {
            return Err(DocumentIoError::invalid_path(path, "`..` の要素を含む"));
        }
        // `file_name()` は末尾の `/` や `/.` を読み飛ばして手前の要素を返すため、
        // 渡された綴りがその名前で終わっていることまで見る。
        let file_name = path
            .file_name()
            .and_then(OsStr::to_str)
            .filter(|name| raw.ends_with(name))
            .ok_or_else(|| DocumentIoError::invalid_path(path, "ファイル名で終わらない"))?;
        // NTFS では `name:stream` が代替データストリームを指し、拡張子の検査を通っても
        // 別のファイル(`notes.txt`)へ書き込めてしまう。OS を問わず拒否する。
        if file_name.contains(':') {
            return Err(DocumentIoError::invalid_path(
                path,
                "ファイル名に `:` を含む",
            ));
        }
        let is_dcmp = path
            .extension()
            .is_some_and(|extension| extension.eq_ignore_ascii_case("dcmp"));
        if !is_dcmp {
            return Err(DocumentIoError::invalid_path(
                path,
                "拡張子が `.dcmp` ではない",
            ));
        }
        Ok(Self(path.to_path_buf()))
    }
}

impl Deref for DocumentFilePath {
    type Target = Path;

    fn deref(&self) -> &Path {
        &self.0
    }
}

impl AsRef<Path> for DocumentFilePath {
    fn as_ref(&self) -> &Path {
        &self.0
    }
}
