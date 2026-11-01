//! 利用者が選んだパスの照合の境界・異常系。

use std::fs;

use super::chosen_paths::{self, ChosenDocumentPaths};
use super::io::DocumentIoError;

use super::test_support::{chosen_document, chosen_paths_in, raw_document_path, TempDir};

#[test]
fn 選んでいないdcmpファイルは選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    // 対照に別のファイルを選んでおく。集合が空だから拒んだ、では通らないようにする。
    chosen_document(&chosen, &dir, "other.dcmp");

    let result = chosen.require(&raw_document_path(&dir, "document.dcmp"));

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

#[cfg(unix)]
#[test]
fn 区切りが続いているだけの綴りでも選んだ綴りと違えば選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let spelling = chosen_document(&chosen, &dir, "document.dcmp");
    let doubled = spelling.replace("/document.dcmp", "//document.dcmp");

    let result = chosen.require(&doubled);

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

#[test]
fn 拡張子がdcmpでないファイルは選ぼうとしても不正なパスを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("notes.txt"), "x").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let result = chosen.choose(&raw_document_path(&dir, "notes.txt"));

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 記録を書き出せなくても選んだパスは起動中なら照合を通る() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    // 記録の置き場の親をファイルにして、書き出しを失敗させる
    fs::write(record_dir.join("blocker"), "").expect("邪魔なファイルを置ける");
    let chosen =
        ChosenDocumentPaths::restore(chosen_paths::record_path(&record_dir.join("blocker")));

    let spelling = chosen_document(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}
