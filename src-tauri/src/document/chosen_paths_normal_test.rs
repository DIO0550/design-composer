//! 利用者が選んだパスの照合(docs/05-architecture.md「選ばれたファイルの記録」)。

use std::fs;
use std::sync::Arc;

use super::io::{save_requested, DocumentManagedState};
use super::known_content::KnownContentRegistry;

#[cfg(unix)]
use super::test_support::{canonical_in, raw_document_path, symlinked_document};
use super::test_support::{chosen_paths_in, chosen_spelling, TempDir};

#[test]
fn 選んだパスは選んだときに返った綴りで照合を通る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}

#[test]
fn 保存ダイアログで選んだまだ無いファイルへ保存できる() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let spelling = chosen_spelling(&chosen, &dir, "untitled.dcmp");
    let managed = DocumentManagedState::new(&chosen, &known);

    save_requested(managed, &spelling, r#"{"version":1}"#).expect("保存に成功する");

    assert_eq!(
        fs::read_to_string(dir.join("untitled.dcmp")).expect("読める"),
        r#"{"version":1}"#
    );
}

// 寄せる前と後で綴りが変わる入力を選ぶ。Linux の一時ディレクトリはそのままでは寄せても
// 綴りが変わらず、寄せずに載せる実装でも通ってしまう。

#[cfg(unix)]
#[test]
fn 寄せると消える要素を含む綴りで選ぶと寄せた綴りが返る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let spelling = chosen
        .record_chosen(&raw_document_path(&dir, "./document.dcmp"))
        .expect("選べる");

    assert_eq!(spelling, canonical_in(&dir, "document.dcmp"));
}

#[cfg(unix)]
#[test]
fn 寄せると消える要素を含む綴りで選ぶと寄せた綴りで照合を通る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    chosen
        .record_chosen(&raw_document_path(&dir, "./document.dcmp"))
        .expect("選べる");

    assert!(chosen.require(&canonical_in(&dir, "document.dcmp")).is_ok());
}

#[cfg(unix)]
#[test]
fn symlink経由の綴りで選ぶと実体の綴りが返る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    let linked = symlinked_document(&dir, "real.dcmp", "link.dcmp");
    let chosen = chosen_paths_in(&record_dir);

    let spelling = chosen.record_chosen(&linked).expect("選べる");

    assert_eq!(spelling, canonical_in(&dir, "real.dcmp"));
}

#[cfg(unix)]
#[test]
fn symlink経由の綴りで選ぶと実体の綴りで照合を通る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    let linked = symlinked_document(&dir, "real.dcmp", "link.dcmp");
    let chosen = chosen_paths_in(&record_dir);

    chosen.record_chosen(&linked).expect("選べる");

    assert!(chosen.require(&canonical_in(&dir, "real.dcmp")).is_ok());
}
