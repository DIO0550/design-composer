use std::fmt;
use std::io;
use std::path::Path;

use serde::Serialize;

/// 永続化 I/O の失敗を表す。
///
/// TS 側が失敗の種類で分岐できるよう、判別可能な union として serialize する
/// (`{ "kind": "notFound", "message": "..." }`)。`kind` を閉じた語彙にすることで、
/// TS 側でメッセージ文字列を見て分岐する必要が無くなる。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DocumentIoError {
    /// 指定されたパスにファイルが存在しない。
    NotFound { message: String },
    /// 読み込み / 書き込みの権限が無い。
    PermissionDenied { message: String },
    /// 親ディレクトリやファイル名を取り出せない等、ファイルとして扱えないパス。
    InvalidPath { message: String },
    /// ファイルの中身が UTF-8 として解釈できない。
    InvalidUtf8 { message: String },
    /// 上記のいずれにも当てはまらない I/O の失敗。
    Io { message: String },
}

impl DocumentIoError {
    /// `io::Error` を、対象パスを添えた `DocumentIoError` に変換する。
    pub(crate) fn from_io(path: &Path, source: &io::Error) -> Self {
        let message = format!("{}: {}", path.display(), source);
        match source.kind() {
            io::ErrorKind::NotFound => Self::NotFound { message },
            io::ErrorKind::PermissionDenied => Self::PermissionDenied { message },
            _ => Self::Io { message },
        }
    }

    pub(crate) fn invalid_path(path: &Path, reason: &str) -> Self {
        Self::InvalidPath {
            message: format!("{}: {}", path.display(), reason),
        }
    }

    /// 種別を切り分けられない失敗を、対象パスを添えて表す。
    pub(crate) fn io(path: &Path, reason: &str) -> Self {
        Self::Io {
            message: format!("{}: {}", path.display(), reason),
        }
    }

    pub(crate) fn invalid_utf8(path: &Path) -> Self {
        Self::InvalidUtf8 {
            message: format!("{}: UTF-8 として解釈できない", path.display()),
        }
    }

    /// 表示・ログ用のメッセージ。
    pub fn message(&self) -> &str {
        match self {
            Self::NotFound { message }
            | Self::PermissionDenied { message }
            | Self::InvalidPath { message }
            | Self::InvalidUtf8 { message }
            | Self::Io { message } => message,
        }
    }
}

impl fmt::Display for DocumentIoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message())
    }
}

impl std::error::Error for DocumentIoError {}
