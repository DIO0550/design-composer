use std::fs;

use super::io::{self, load_requested};
use super::known_content::KnownContentRegistry;

use super::test_support::{chosen_document, chosen_file_path, chosen_paths_in, TempDir};

#[test]
fn 保存した内容がそのまま読み込める() {
    let dir = TempDir::new("normal");
    let path = chosen_file_path(&dir, "document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1,"artboards":[]}"#;

    io::save(&known, &path, content).expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), content);
}

#[test]
fn 既存のファイルへ保存すると内容が置き換わる() {
    let dir = TempDir::new("normal");
    let path = chosen_file_path(&dir, "document.dcmp");
    let known = KnownContentRegistry::new();

    io::save(&known, &path, r#"{"version":1}"#).expect("初回の保存に成功する");
    io::save(&known, &path, r#"{"version":2}"#).expect("上書きの保存に成功する");

    assert_eq!(
        io::load(&path).expect("読み込みに成功する"),
        r#"{"version":2}"#
    );
}

#[test]
fn 空の内容も保存して読み込める() {
    let dir = TempDir::new("normal");
    let path = chosen_file_path(&dir, "document.dcmp");
    let known = KnownContentRegistry::new();

    io::save(&known, &path, "").expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), "");
}

#[test]
fn マルチバイト文字を含む内容が壊れずに読み込める() {
    let dir = TempDir::new("normal");
    let path = chosen_file_path(&dir, "document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"name":"見出し","text":"日本語のテキスト 🎨"}"#;

    io::save(&known, &path, content).expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), content);
}

#[test]
fn 保存の後に一時ファイルが残らない() {
    let dir = TempDir::new("normal");
    let path = chosen_file_path(&dir, "document.dcmp");
    let known = KnownContentRegistry::new();

    io::save(&known, &path, r#"{"version":1}"#).expect("保存に成功する");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn 同じディレクトリの複数のファイルをそれぞれ保存して読み込める() {
    let dir = TempDir::new("normal");
    let known = KnownContentRegistry::new();
    let first = chosen_file_path(&dir, "first.dcmp");
    let second = chosen_file_path(&dir, "second.dcmp");

    io::save(&known, &first, r#"{"name":"first"}"#).expect("1 つ目の保存に成功する");
    io::save(&known, &second, r#"{"name":"second"}"#).expect("2 つ目の保存に成功する");

    assert_eq!(
        io::load(&first).expect("読み込みに成功する"),
        r#"{"name":"first"}"#
    );
    assert_eq!(
        io::load(&second).expect("読み込みに成功する"),
        r#"{"name":"second"}"#
    );
}

#[test]
fn 選んだdcmpファイルを選んだときに返った綴りで渡すと中身が読み込める() {
    let dir = TempDir::new("normal");
    let record_dir = TempDir::new("normal-record");
    let content = r#"{"version":1}"#;
    fs::write(dir.join("document.dcmp"), content).expect("読み込む対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let spelling = chosen_document(&chosen, &dir, "document.dcmp");

    let loaded = load_requested(&chosen, &spelling).expect("読み込みに成功する");

    assert_eq!(loaded, content);
}
