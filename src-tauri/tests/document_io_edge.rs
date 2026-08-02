// テスト名は rules/testing.md に従い仕様の文として日本語で書く。
// UTF8 のようなラテン文字を含むと snake case ではなくなるため、この lint は無効にする。
#![allow(non_snake_case)]

mod common;

use std::fs;

use app_lib::document_io::{self, DocumentIoError, SelfWriteRegistry};

use common::TempDir;

#[test]
fn 存在しないファイルの読み込みは見つからないことを返す() {
    let dir = TempDir::new("edge");

    let error = document_io::load(&dir.join("missing.dcmp")).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::NotFound { .. }));
}

#[test]
fn 存在しないディレクトリ配下への保存は失敗する() {
    let dir = TempDir::new("edge");
    let registry = SelfWriteRegistry::new();

    let error = document_io::save(&registry, &dir.join("missing/document.dcmp"), r#"{"a":1}"#)
        .expect_err("保存に失敗する");

    assert!(matches!(error, DocumentIoError::NotFound { .. }));
}

#[test]
fn 保存に失敗したとき一時ファイルが残らない() {
    let dir = TempDir::new("edge");
    let registry = SelfWriteRegistry::new();

    // 書き込み先をディレクトリにすることで、一時ファイルの作成後に rename を失敗させる
    let path = dir.join("document.dcmp");
    fs::create_dir(&path).expect("ディレクトリを作成できる");

    document_io::save(&registry, &path, r#"{"a":1}"#).expect_err("保存に失敗する");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn UTF8として解釈できないファイルの読み込みは不正なUTF8を返す() {
    let dir = TempDir::new("edge");
    let path = dir.join("broken.dcmp");
    fs::write(&path, [0xff, 0xfe, 0x00, 0x80]).expect("不正なバイト列を書ける");

    let error = document_io::load(&path).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::InvalidUtf8 { .. }));
}

#[test]
fn ディレクトリを読み込もうとすると失敗する() {
    let dir = TempDir::new("edge");

    let error = document_io::load(dir.path()).expect_err("読み込みに失敗する");

    assert!(matches!(error, DocumentIoError::Io { .. }));
}

#[test]
fn 失敗したときのエラーは対象のパスを含む() {
    let dir = TempDir::new("edge");
    let path = dir.join("missing.dcmp");

    let error = document_io::load(&path).expect_err("読み込みに失敗する");

    assert!(
        error.message().contains("missing.dcmp"),
        "エラーメッセージに対象のパスが含まれていない: {}",
        error.message()
    );
}

#[test]
fn 保存の失敗は自書き込みとして記録されない() {
    let dir = TempDir::new("edge");
    let registry = SelfWriteRegistry::new();
    let path = dir.join("missing/document.dcmp");
    let content = r#"{"a":1}"#;

    document_io::save(&registry, &path, content).expect_err("保存に失敗する");

    assert!(!registry.is_self_write(&path, content));
}
