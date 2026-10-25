//! 寄せる綴りとして拒否するもの。いずれも `InvalidPath` になる。

use super::canonical_path::canonicalize_requested;
use super::io::DocumentIoError;

#[cfg(unix)]
use super::test_support::{raw_document_path, TempDir};

fn is_rejected(raw: &str) -> bool {
    matches!(
        canonicalize_requested(raw),
        Err(DocumentIoError::InvalidPath { .. })
    )
}

#[test]
fn 相対パスは拒否される() {
    assert!(is_rejected("document.dcmp"));
}

#[cfg(unix)]
#[test]
fn 拡張子がdcmpでないファイルは拒否される() {
    let dir = TempDir::new("canonical-edge");
    std::fs::write(dir.join("notes.txt"), "x").expect("ファイルを用意できる");

    assert!(is_rejected(&raw_document_path(&dir, "notes.txt")));
}

#[cfg(unix)]
#[test]
fn 実体の拡張子がdcmpでないsymlinkは拒否される() {
    let dir = TempDir::new("canonical-edge");
    std::fs::write(dir.join("notes.txt"), "x").expect("ファイルを用意できる");
    std::os::unix::fs::symlink(dir.join("notes.txt"), dir.join("link.dcmp"))
        .expect("symlink を作れる");

    assert!(is_rejected(&raw_document_path(&dir, "link.dcmp")));
}

// macOS は UTF-8 で表せない名前のディレクトリを作れないので Linux に限る。
#[cfg(target_os = "linux")]
#[test]
fn 寄せた綴りがutf8で表せなければ拒否される() {
    use std::ffi::OsStr;
    use std::os::unix::ffi::OsStrExt;

    let dir = TempDir::new("canonical-edge");
    let not_utf8 = dir.path().join(OsStr::from_bytes(b"bad\xffdir"));
    std::fs::create_dir(&not_utf8).expect("ディレクトリを用意できる");
    std::os::unix::fs::symlink(&not_utf8, dir.join("link")).expect("symlink を作れる");

    assert!(is_rejected(&raw_document_path(&dir, "link/new.dcmp")));
}
