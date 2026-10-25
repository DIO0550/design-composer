//! 同じファイルを指す別の綴りを、1 つの綴りへ寄せる。

use std::fs;

use super::canonical_path::canonicalize_requested;
use super::test_support::{raw_document_path, TempDir};

/// `dir` を正規化した綴りの配下に `relative` を置いた、期待する綴り。
///
/// macOS の一時ディレクトリは `/var` が `/private/var` への symlink なので、期待値も
/// 正規化したディレクトリから組み立てる。
#[cfg(unix)]
fn canonical_in(dir: &TempDir, relative: &str) -> String {
    dir.path()
        .canonicalize()
        .expect("一時ディレクトリを正規化できる")
        .join(relative)
        .to_str()
        .expect("一時ディレクトリのパスは UTF-8")
        .to_string()
}

/// 寄せた綴りを文字列で返す。
///
/// `Path` どうしの比較は要素ごとに行い `.` や続いた区切りを読み飛ばすので、綴りは文字列で比べる。
fn canonicalized(raw: &str) -> String {
    canonicalize_requested(raw)
        .expect("寄せた綴りを返す")
        .to_str()
        .expect("寄せた綴りは UTF-8")
        .to_string()
}

#[cfg(unix)]
#[test]
fn カレントディレクトリを指す要素は取り除かれる() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let raw = format!("{}/./document.dcmp", dir.path().display());

    assert_eq!(canonicalized(&raw), canonical_in(&dir, "document.dcmp"));
}

#[cfg(unix)]
#[test]
fn 続いた区切りは1つになる() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let raw = format!("{}//document.dcmp", dir.path().display());

    assert_eq!(canonicalized(&raw), canonical_in(&dir, "document.dcmp"));
}

#[cfg(unix)]
#[test]
fn symlink経由の綴りは実体の綴りになる() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("real.dcmp"), "{}").expect("ファイルを用意できる");
    std::os::unix::fs::symlink(dir.join("real.dcmp"), dir.join("link.dcmp"))
        .expect("symlink を作れる");

    let canonical = canonicalized(&raw_document_path(&dir, "link.dcmp"));

    assert_eq!(canonical, canonical_in(&dir, "real.dcmp"));
}

#[cfg(unix)]
#[test]
fn symlinkのディレクトリにまだ無いファイルはディレクトリだけ実体の綴りになる() {
    let dir = TempDir::new("canonical");
    fs::create_dir(dir.join("real")).expect("ディレクトリを用意できる");
    std::os::unix::fs::symlink(dir.join("real"), dir.join("link")).expect("symlink を作れる");

    let canonical = canonicalized(&raw_document_path(&dir, "link/new.dcmp"));

    assert_eq!(canonical, canonical_in(&dir, "real/new.dcmp"));
}

#[test]
fn 親ディレクトリが無ければ渡した綴りのまま返る() {
    let dir = TempDir::new("canonical");
    let raw = raw_document_path(&dir, "missing/document.dcmp");

    assert_eq!(canonicalized(&raw), raw);
}

#[cfg(unix)]
#[test]
fn 壊れたsymlinkはリンクの綴りのまま返る() {
    let dir = TempDir::new("canonical");
    std::os::unix::fs::symlink(dir.join("gone.dcmp"), dir.join("broken.dcmp"))
        .expect("symlink を作れる");

    let canonical = canonicalized(&raw_document_path(&dir, "broken.dcmp"));

    assert_eq!(canonical, canonical_in(&dir, "broken.dcmp"));
}

#[cfg(unix)]
#[test]
fn 寄せた綴りをもう一度寄せても変わらない() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let once = canonicalized(&format!("{}/./document.dcmp", dir.path().display()));

    let twice = canonicalized(&once);

    assert_eq!(twice, once);
}

// macOS の既定のボリューム(APFS)は大文字小文字を区別しない前提。区別するボリュームでは
// 大小違いは別のファイルになり、このテストは落ちる。
#[cfg(target_os = "macos")]
#[test]
fn 大文字小文字だけが違う綴りはディスク上の綴りになる() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("Document.dcmp"), "{}").expect("ファイルを用意できる");

    let canonical = canonicalized(&raw_document_path(&dir, "DOCUMENT.dcmp"));

    assert_eq!(canonical, canonical_in(&dir, "Document.dcmp"));
}

#[cfg(windows)]
#[test]
fn 寄せた綴りはドライブの前に接頭辞を持たない() {
    let dir = TempDir::new("canonical");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");

    let canonical = canonicalized(&raw_document_path(&dir, "document.dcmp"));

    assert!(!canonical.starts_with(r"\\?\"));
}
