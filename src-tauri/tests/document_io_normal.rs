mod common;

use app_lib::document::io;
use app_lib::document::known_content::KnownContentRegistry;

use common::TempDir;

#[test]
fn 保存した内容がそのまま読み込める() {
    let dir = TempDir::new("normal");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"version":1,"artboards":[]}"#;

    io::save(&known, &path, content).expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), content);
}

#[test]
fn 既存のファイルへ保存すると内容が置き換わる() {
    let dir = TempDir::new("normal");
    let path = dir.join("document.dcmp");
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
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    io::save(&known, &path, "").expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), "");
}

#[test]
fn マルチバイト文字を含む内容が壊れずに読み込める() {
    let dir = TempDir::new("normal");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();
    let content = r#"{"name":"見出し","text":"日本語のテキスト 🎨"}"#;

    io::save(&known, &path, content).expect("保存に成功する");

    assert_eq!(io::load(&path).expect("読み込みに成功する"), content);
}

#[test]
fn 保存の後に一時ファイルが残らない() {
    let dir = TempDir::new("normal");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    io::save(&known, &path, r#"{"version":1}"#).expect("保存に成功する");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn 同じディレクトリの複数のファイルをそれぞれ保存して読み込める() {
    let dir = TempDir::new("normal");
    let known = KnownContentRegistry::new();
    let first = dir.join("first.dcmp");
    let second = dir.join("second.dcmp");

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
