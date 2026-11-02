//! 利用者が選んだパスの照合の境界・異常系。

use std::fs;

use super::chosen_paths::{self, ChosenDocumentPaths};
use super::io::DocumentIoError;

#[cfg(unix)]
use super::test_support::symlinked_document;
use super::test_support::{chosen_paths_in, chosen_spelling, raw_document_path, TempDir};

#[test]
fn 選んでいないdcmpファイルは選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    // 対照に別のファイルを選んでおく。集合が空だから拒んだ、では通らないようにする。
    chosen_spelling(&chosen, &dir, "other.dcmp");

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
    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");
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

    let result = chosen.record_chosen(&raw_document_path(&dir, "notes.txt"));

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 記録を書き出せなくても選んだパスは起動中なら照合を通る() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    let chosen =
        ChosenDocumentPaths::restore(chosen_paths::record_path(&record_dir.join("blocker")));
    // 読み戻したあとで記録の置き場の親をファイルにして、書き出しを失敗させる(読み戻す前に
    // 置くと、読めない記録として書き出しそのものを止めてしまう)
    fs::write(record_dir.join("blocker"), "").expect("邪魔なファイルを置ける");

    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}

#[test]
fn 記録ファイルを持たない集合でも選んだパスは照合を通る() {
    let dir = TempDir::new("chosen-edge");
    let chosen = ChosenDocumentPaths::in_memory();

    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}

#[test]
fn 大文字小文字だけが違う綴りは選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");
    let recased = spelling.replace("document.dcmp", "Document.dcmp");

    let result = chosen.require(&recased);

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

#[cfg(unix)]
#[test]
fn 寄せると消える要素を含む綴りで選んでもその綴りのままでは選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("ファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let detoured = raw_document_path(&dir, "./document.dcmp");
    chosen.record_chosen(&detoured).expect("選べる");

    let result = chosen.require(&detoured);

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

#[cfg(unix)]
#[test]
fn symlink経由の綴りで選んでもその綴りのままでは選ばれていないことを返す() {
    let dir = TempDir::new("chosen-edge");
    let record_dir = TempDir::new("chosen-edge-record");
    let linked = symlinked_document(&dir, "real.dcmp", "link.dcmp");
    let chosen = chosen_paths_in(&record_dir);
    chosen.record_chosen(&linked).expect("選べる");

    let result = chosen.require(&linked);

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}
