//! 利用者が選んだパスの照合(docs/05-architecture.md「選ばれたファイルの記録」)。

use std::fs;
use std::sync::Arc;

use super::io::{save_requested, DocumentManagedState};
use super::known_content::KnownContentRegistry;

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
