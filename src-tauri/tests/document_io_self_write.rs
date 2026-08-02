//! 自書き込みの識別（file watch の自己ループ防止に使う。#27）。

mod common;

use std::fs;

use app_lib::document_io;
use app_lib::known_content::KnownContentRegistry;

use common::TempDir;

#[test]
fn 保存した内容は自書き込みと判定される() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1}"#;

    document_io::save(&known, &path, content).expect("保存に成功する");

    assert!(known.is_known(&path, content));
}

#[test]
fn 外部が書き換えた内容は自書き込みと判定されない() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    document_io::save(&known, &path, r#"{"version":1}"#).expect("保存に成功する");
    fs::write(&path, r#"{"version":2}"#).expect("外部からの書き込みができる");

    let external = document_io::load(&path).expect("読み込みに成功する");
    assert!(!known.is_known(&path, &external));
}

#[test]
fn 一度も保存していないパスは自書き込みと判定されない() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    fs::write(&path, r#"{"version":1}"#).expect("外部からの書き込みができる");

    assert!(!known.is_known(&path, r#"{"version":1}"#));
}

#[test]
fn 同じ内容を何度問い合わせても自書き込みと判定され続ける() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1}"#;

    document_io::save(&known, &path, content).expect("保存に成功する");

    // OS は 1 回の書き込みに対して複数の変更イベントを出すことがあるため、
    // 2 回目以降の問い合わせでも判定が変わってはならない
    assert!(known.is_known(&path, content));
    assert!(known.is_known(&path, content));
    assert!(known.is_known(&path, content));
}

#[test]
fn 上書き保存すると新しい内容だけが自書き込みと判定される() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    document_io::save(&known, &path, r#"{"version":1}"#).expect("初回の保存に成功する");
    document_io::save(&known, &path, r#"{"version":2}"#).expect("上書きの保存に成功する");

    assert!(known.is_known(&path, r#"{"version":2}"#));
    assert!(!known.is_known(&path, r#"{"version":1}"#));
}

#[test]
fn 別のパスの記録は互いに影響しない() {
    let dir = TempDir::new("self-write");
    let known = KnownContentRegistry::new();
    let first = dir.join("first.dcmp");
    let second = dir.join("second.dcmp");

    document_io::save(&known, &first, r#"{"name":"first"}"#).expect("1 つ目の保存に成功する");
    document_io::save(&known, &second, r#"{"name":"second"}"#).expect("2 つ目の保存に成功する");

    assert!(known.is_known(&first, r#"{"name":"first"}"#));
    assert!(!known.is_known(&first, r#"{"name":"second"}"#));
    assert!(known.is_known(&second, r#"{"name":"second"}"#));
}

#[test]
fn 同じファイルを指す異なる表記のパスでも自書き込みと判定される() {
    let dir = TempDir::new("self-write");
    fs::create_dir(dir.join("sub")).expect("サブディレクトリを作成できる");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1}"#;

    document_io::save(&known, &path, content).expect("保存に成功する");

    // file watch は同じファイルを別の表記で報告することがある
    let detoured = dir.join("sub").join("..").join("document.dcmp");
    assert!(known.is_known(&detoured, content));
}

#[test]
fn 記録を破棄すると自書き込みと判定されなくなる() {
    let dir = TempDir::new("self-write");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1}"#;

    document_io::save(&known, &path, content).expect("保存に成功する");
    known.forget(&path);

    assert!(!known.is_known(&path, content));
}
