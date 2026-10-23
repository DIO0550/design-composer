// テスト名は rules/testing.md に従い仕様の文として書き、このリポジトリの既存のテストに
// 合わせて日本語で書く。
// UTF8 のようなラテン文字を含むと snake case ではなくなるため、この lint は無効にする。
#![allow(non_snake_case)]

use std::fs;

use super::io::{self, load_document, save_requested, DocumentIoError};
use super::known_content::KnownContentRegistry;

use super::test_support::{document_file_path, raw_document_path, TempDir};

#[test]
fn 存在しないファイルの読み込みは見つからないことを返す() {
    let dir = TempDir::new("edge");

    let error =
        io::load(&document_file_path(&dir, "missing.dcmp")).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::NotFound { .. }));
}

#[test]
fn 存在しないディレクトリ配下への保存は失敗する() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();

    let error = io::save(
        &known,
        &document_file_path(&dir, "missing/document.dcmp"),
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
    let path = document_file_path(&dir, "document.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    io::save(&known, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn UTF8として解釈できないファイルの読み込みは不正なUTF8を返す() {
    let dir = TempDir::new("edge");
    let path = document_file_path(&dir, "broken.dcmp");
    fs::write(&path, [0xff, 0xfe, 0x00, 0x80]).expect("不正なバイト列を書ける");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::InvalidUtf8 { .. }));
}

#[test]
fn ディレクトリを読み込もうとすると失敗する() {
    let dir = TempDir::new("edge");
    let path = document_file_path(&dir, "folder.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    let error = io::load(&path).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::Io { .. }));
}

#[test]
fn 失敗したときのエラーは対象のパスを含む() {
    let dir = TempDir::new("edge");
    let path = document_file_path(&dir, "missing.dcmp");

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
    let path = document_file_path(&dir, "missing/document.dcmp");
    let content = r#"{"a":1}"#;

    io::save(&known, &path, content).expect_err("保存に失敗する");

    assert!(!known.is_known(&path, content));
}

#[test]
fn 拡張子がdcmpでない既存のファイルは中身があっても読み込まずに不正なパスを返す() {
    let dir = TempDir::new("edge");
    fs::write(dir.join("notes.txt"), "secret").expect("中身のあるファイルを用意できる");
    let raw = raw_document_path(&dir, "notes.txt");

    let result = load_document(raw);

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 相対パスの読み込みは不正なパスを返す() {
    let result = load_document("document.dcmp".to_string());

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
}

#[test]
fn 拡張子がdcmpでない既存のファイルへの保存は不正なパスを返して中身を変えない() {
    let dir = TempDir::new("edge");
    fs::write(dir.join("notes.txt"), "secret").expect("中身のあるファイルを用意できる");
    let known = KnownContentRegistry::new();

    let result = save_requested(&known, &raw_document_path(&dir, "notes.txt"), r#"{"a":1}"#);

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
    assert_eq!(
        fs::read_to_string(dir.join("notes.txt")).expect("読める"),
        "secret"
    );
}

#[test]
fn 拡張子がdcmpでない存在しないファイルへの保存はファイルを作らない() {
    let dir = TempDir::new("edge");
    let known = KnownContentRegistry::new();

    let result = save_requested(&known, &raw_document_path(&dir, "notes.txt"), r#"{"a":1}"#);

    assert!(matches!(result, Err(DocumentIoError::InvalidPath { .. })));
    assert!(dir.file_names().is_empty());
}
