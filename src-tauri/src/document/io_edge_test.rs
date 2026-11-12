// テスト名は rules/testing.md に従い仕様の文として書き、このリポジトリの既存のテストに
// 合わせて日本語で書く。
// UTF8 のようなラテン文字を含むと snake case ではなくなるため、この lint は無効にする。
#![allow(non_snake_case)]

use std::fs;
use std::path::Path;

use std::sync::Arc;

use super::io::{self, load_requested, save_requested, DocumentIoError, DocumentManagedState};
use super::known_content::KnownContentRegistry;

use super::test_support::{
    chosen_file_path, chosen_paths_in, chosen_spelling, raw_document_path, TempDir,
};

#[test]
fn 存在しないファイルの読み込みは見つからないことを返す() {
    let dir = TempDir::new("edge");

    let error = io::load(&chosen_file_path(&dir, "missing.dcmp")).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::NotFound { .. }));
}

#[test]
fn 存在しないディレクトリ配下への保存は失敗する() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();

    let error = io::save(
        &known,
        &chosen_file_path(&dir, "missing/document.dcmp"),
        r#"{"a":1}"#,
    )
    .expect_err("保存に失敗する");

    assert!(matches!(error, DocumentIoError::NotFound { .. }));
}

#[test]
fn 保存に失敗したとき一時ファイルが残らない() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();

    // 書き込み先をディレクトリにすることで、一時ファイルの作成後に rename を失敗させる
    let path = chosen_file_path(&dir, "document.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    io::save(&known, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn 保存先がディレクトリのとき保存はIOの失敗を返す() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();
    let path = chosen_file_path(&dir, "document.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    let error = io::save(&known, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert!(matches!(error, DocumentIoError::Io { .. }));
}

/// エラーメッセージが保存先のフルパスを含むことを確かめる。
fn assert_message_contains_full_path(error: &DocumentIoError, destination: &Path) {
    // 一時ファイル名 `.document.dcmp.<pid>.<n>.tmp` もファイル名を含むので、フルパスで照合する
    let full_path = destination.display().to_string();
    assert!(
        error.message().contains(&full_path),
        "エラーメッセージに保存先のパスが含まれていない: {}",
        error.message()
    );
}

#[test]
fn 保存の失敗には保存先のパスが載る() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();
    let path = chosen_file_path(&dir, "document.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    let error = io::save(&known, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert_message_contains_full_path(&error, &path);
}

#[test]
fn 一時ファイルを作れないときの保存の失敗には保存先のパスが載る() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();
    // 親ディレクトリが無いので、rename より前の一時ファイルの作成で失敗する
    let path = chosen_file_path(&dir, "missing/document.dcmp");

    let error = io::save(&known, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert_message_contains_full_path(&error, &path);
}

#[test]
fn UTF8として解釈できないファイルの読み込みは不正なUTF8を返す() {
    let dir = TempDir::new("edge");
    let path = chosen_file_path(&dir, "broken.dcmp");
    fs::write(&path, [0xff, 0xfe, 0x00, 0x80]).expect("不正なバイト列を書ける");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::InvalidUtf8 { .. }));
}

#[test]
fn ディレクトリを読み込もうとすると失敗する() {
    let dir = TempDir::new("edge");
    let path = chosen_file_path(&dir, "folder.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::Io { .. }));
}

#[test]
fn 失敗したときのエラーは対象のパスを含む() {
    let dir = TempDir::new("edge");
    let path = chosen_file_path(&dir, "missing.dcmp");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(
        error.message().contains("missing.dcmp"),
        "エラーメッセージに対象のパスが含まれていない: {}",
        error.message()
    );
}

#[test]
fn 保存の失敗は自書き込みとして記録されない() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();
    let path = chosen_file_path(&dir, "missing/document.dcmp");
    let content = r#"{"a":1}"#;

    io::save(&known, &path, content).expect_err("保存に失敗する");

    assert!(!known.is_known(&path, content));
}

// 不正なパスを返すことを確かめるテストは、選ばれたパスの集合を空にして呼ぶ。`.dcmp` 以外・
// 相対パスはそもそも選べないので、集合を空にしても照合より先に形の検査で落ちることを固定できる。

#[test]
fn 拡張子がdcmpでない既存のファイルは中身があっても読み込まずに不正なパスを返す() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    fs::write(dir.join("notes.txt"), "secret").expect("中身のあるファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let result = load_requested(&chosen, &raw_document_path(&dir, "notes.txt"));

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 相対パスの読み込みは不正なパスを返す() {
    let record_dir = TempDir::new("edge-record");
    let chosen = chosen_paths_in(&record_dir);

    let result = load_requested(&chosen, "document.dcmp");

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 拡張子がdcmpでない既存のファイルへの保存は不正なパスを返して中身を変えない() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    fs::write(dir.join("notes.txt"), "secret").expect("中身のあるファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let managed = DocumentManagedState::new(&chosen, &known);

    let result = save_requested(managed, &raw_document_path(&dir, "notes.txt"), r#"{"a":1}"#);

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
    assert_eq!(
        fs::read_to_string(dir.join("notes.txt")).expect("読める"),
        "secret"
    );
}

#[test]
fn 拡張子がdcmpでない存在しないファイルへの保存はファイルを作らない() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    let chosen = chosen_paths_in(&record_dir);
    let known = Arc::new(KnownContentRegistry::new());
    let managed = DocumentManagedState::new(&chosen, &known);

    let result = save_requested(managed, &raw_document_path(&dir, "notes.txt"), r#"{"a":1}"#);

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
    assert!(dir.file_names().is_empty());
}

#[test]
fn 選んでいないdcmpファイルは中身があっても読み込まずに選ばれていないことを返す() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    fs::write(dir.join("document.dcmp"), r#"{"version":1}"#).expect("読み込む対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    // 対照に別のファイルを選んでおく。集合が空だから拒んだ、では通らないようにする。
    chosen_spelling(&chosen, &dir, "other.dcmp");

    let result = load_requested(&chosen, &raw_document_path(&dir, "document.dcmp"));

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
}

#[test]
fn 選んでいないdcmpファイルへの保存は選ばれていないことを返して中身を変えない() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    fs::write(dir.join("document.dcmp"), r#"{"version":1}"#).expect("保存先を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    chosen_spelling(&chosen, &dir, "other.dcmp");
    let known = Arc::new(KnownContentRegistry::new());
    let managed = DocumentManagedState::new(&chosen, &known);

    let result = save_requested(
        managed,
        &raw_document_path(&dir, "document.dcmp"),
        r#"{"version":2}"#,
    );

    assert!(matches!(result, Err(DocumentIoError::NotChosen { .. })));
    assert_eq!(
        fs::read_to_string(dir.join("document.dcmp")).expect("読める"),
        r#"{"version":1}"#
    );
}

#[test]
fn 選ばれていないことはその種別でシリアライズされる() {
    let dir = TempDir::new("edge");
    let record_dir = TempDir::new("edge-record");
    let chosen = chosen_paths_in(&record_dir);

    let error = load_requested(&chosen, &raw_document_path(&dir, "document.dcmp"))
        .expect_err("読み込みに失敗する");
    let serialized = serde_json::to_value(&error).expect("JSON にできる");

    assert_eq!(serialized["kind"], "notChosen");
}
