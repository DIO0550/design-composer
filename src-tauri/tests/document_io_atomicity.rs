//! 完了条件「書き込み途中のファイルを外部から読んでも不完全な JSON にならない」の検証。

// テスト名は rules/testing.md に従い仕様の文として日本語で書く。
// JSON のようなラテン文字を含むと snake case ではなくなるため、この lint は無効にする。
#![allow(non_snake_case)]

mod common;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

use app_lib::document::io;
use app_lib::document::known_content::KnownContentRegistry;

use common::{document, TempDir};

#[test]
fn 書き込みを繰り返している最中に読み続けても常に完全なJSONが読める() {
    let dir = TempDir::new("atomicity");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    // アトミックでない書き込みなら途中状態が観測できる程度の大きさにする
    let before = document("before", 4000);
    let after = document("after", 4000);

    io::save(&known, &path, &before).expect("初回の保存に成功する");

    let stop = Arc::new(AtomicBool::new(false));
    let reader_stop = Arc::clone(&stop);
    let reader_path = path.clone();
    let readable = [before.clone(), after.clone()];

    let reader = thread::spawn(move || {
        let mut read_count = 0usize;
        while !reader_stop.load(Ordering::Relaxed) {
            let content = io::load(&reader_path).expect("読み込みに成功する");

            assert!(
                serde_json::from_str::<serde_json::Value>(&content).is_ok(),
                "不完全な JSON が読めた ({} バイト)",
                content.len()
            );
            assert!(
                readable.contains(&content),
                "書き込み前でも書き込み後でもない内容が読めた ({} バイト)",
                content.len()
            );

            read_count += 1;
        }
        read_count
    });

    for round in 0..50 {
        let content = if round % 2 == 0 { &after } else { &before };
        io::save(&known, &path, content).expect("保存に成功する");
    }

    stop.store(true, Ordering::Relaxed);
    let read_count = reader
        .join()
        .expect("読み込み側が不完全な内容を観測していない");

    assert!(read_count > 0, "読み込みが 1 度も行われていない");
}

#[test]
fn 書き込みを繰り返しても一時ファイルが残らない() {
    let dir = TempDir::new("atomicity");
    let path = dir.join("document.dcmp");
    let known = KnownContentRegistry::new();

    for version in 0..20 {
        io::save(&known, &path, &document(&format!("v{version}"), 100)).expect("保存に成功する");
    }

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}

#[test]
fn 複数のスレッドから同じファイルへ書き込んでも読み手には完全なJSONだけが見える() {
    let dir = TempDir::new("atomicity");
    let path = dir.join("document.dcmp");

    let writable: Vec<String> = (0..4)
        .map(|writer| document(&format!("writer-{writer}"), 2000))
        .collect();

    io::save(&KnownContentRegistry::new(), &path, &writable[0]).expect("初回の保存に成功する");

    let stop = Arc::new(AtomicBool::new(false));
    let reader_stop = Arc::clone(&stop);
    let reader_path = path.clone();
    let readable = writable.clone();

    let reader = thread::spawn(move || {
        while !reader_stop.load(Ordering::Relaxed) {
            let content = io::load(&reader_path).expect("読み込みに成功する");
            assert!(
                readable.contains(&content),
                "どの書き手のものでもない内容が読めた ({} バイト)",
                content.len()
            );
        }
    });

    let writers: Vec<_> = writable
        .into_iter()
        .map(|content| {
            let writer_path = path.clone();
            thread::spawn(move || {
                let known = KnownContentRegistry::new();
                for _ in 0..20 {
                    io::save(&known, &writer_path, &content).expect("保存に成功する");
                }
            })
        })
        .collect();

    for writer in writers {
        writer.join().expect("書き込み側が panic しない");
    }

    stop.store(true, Ordering::Relaxed);
    reader
        .join()
        .expect("読み込み側が不完全な内容を観測していない");

    assert_eq!(dir.file_names(), vec!["document.dcmp".to_string()]);
}
