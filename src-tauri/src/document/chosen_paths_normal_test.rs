//! 利用者が選んだパスの照合(docs/05-architecture.md「選ばれたファイルの記録」)。

use std::fs;
use std::sync::Arc;

use super::io::{save_requested, DocumentRegistries};
use super::known_content::KnownContentRegistry;

use super::test_support::{chosen_document, chosen_paths_in, TempDir};

#[test]
fn 選んだパスは選んだときに返った綴りで照合を通る() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("選ぶファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let spelling = chosen_document(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}

#[test]
fn 保存ダイアログで選んだまだ無いファイルへ保存できる() {
    let dir = TempDir::new("chosen-normal");
    let record_dir = TempDir::new("chosen-normal-record");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let spelling = chosen_document(&chosen, &dir, "untitled.dcmp");
    let registries = DocumentRegistries {
        chosen: &chosen,
        known: &known,
    };

    save_requested(registries, &spelling, r#"{"version":1}"#).expect("保存に成功する");

    assert_eq!(
        fs::read_to_string(dir.join("untitled.dcmp")).expect("読める"),
        r#"{"version":1}"#
    );
}
