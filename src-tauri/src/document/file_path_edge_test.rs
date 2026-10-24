//! ドキュメントのパスとして拒否するもの。いずれも `InvalidPath` になる。

use super::file_path::DocumentFilePath;
use super::io::DocumentIoError;

fn is_rejected(raw: &str) -> bool {
    matches!(
        DocumentFilePath::parse(raw),
        Err(DocumentIoError::InvalidPath { .. })
    )
}

#[test]
fn 相対パスは拒否される() {
    assert!(is_rejected("document.dcmp"));
}

#[test]
fn カレントディレクトリから始まる相対パスは拒否される() {
    assert!(is_rejected("./doc.dcmp"));
}

#[cfg(unix)]
#[test]
fn 親ディレクトリへ移動する要素を含むパスは拒否される() {
    assert!(is_rejected("/a/../b.dcmp"));
}

#[cfg(unix)]
#[test]
fn 拡張子がdcmpでないファイルは拒否される() {
    assert!(is_rejected("/a/b.txt"));
}

#[cfg(unix)]
#[test]
fn 拡張子の無いファイルは拒否される() {
    assert!(is_rejected("/a/b"));
}

#[cfg(unix)]
#[test]
fn ドットで始まる名前がdcmpだけのファイルは拡張子を持たないので拒否される() {
    assert!(is_rejected("/a/.dcmp"));
}

#[cfg(unix)]
#[test]
fn dcmpの後ろに別の拡張子が続くファイルは拒否される() {
    assert!(is_rejected("/a/b.dcmp.txt"));
}

#[cfg(unix)]
#[test]
fn 拡張子がdcmpで始まるだけのファイルは拒否される() {
    assert!(is_rejected("/a/b.dcmpx"));
}

#[cfg(unix)]
#[test]
fn 末尾がスラッシュのパスは拒否される() {
    assert!(is_rejected("/a/b.dcmp/"));
}

#[cfg(unix)]
#[test]
fn 末尾がカレントディレクトリの要素のパスは拒否される() {
    assert!(is_rejected("/a/b.dcmp/."));
}

#[test]
fn 空文字は拒否される() {
    assert!(is_rejected(""));
}

#[cfg(unix)]
#[test]
fn ルートだけのパスは拒否される() {
    assert!(is_rejected("/"));
}

#[cfg(unix)]
#[test]
fn ファイル名にコロンを含むパスは拒否される() {
    assert!(is_rejected("/a/notes.txt:x.dcmp"));
}

#[cfg(unix)]
#[test]
fn 拒否したときのメッセージは渡されたパスを含む() {
    let error = DocumentFilePath::parse("/a/b.txt").expect_err("拒否される");

    assert!(
        error.message().contains("/a/b.txt"),
        "拒否メッセージに渡したパスが含まれていない: {}",
        error.message()
    );
}
