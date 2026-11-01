//! ウィンドウへ落とされたファイルを、選ばれたものとして載せてから知らせる。

use std::fs;
use std::path::PathBuf;

use super::file_drop::accept_dropped;

use super::test_support::{chosen_paths_in, raw_document_path, TempDir};

/// `document-dropped` で知らせる並び。
fn notified_paths(dropped: &super::file_drop::DocumentDropped) -> Vec<String> {
    let payload = serde_json::to_value(dropped).expect("ペイロードを JSON にできる");
    serde_json::from_value(payload["paths"].clone()).expect("paths は文字列の並び")
}

#[test]
fn 落としたdcmpファイルは知らせた綴りで照合を通る() {
    let dir = TempDir::new("drop-normal");
    let record_dir = TempDir::new("drop-normal-record");
    fs::write(dir.join("document.dcmp"), "{}").expect("落とすファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);

    let dropped = accept_dropped(&chosen, &[dir.join("document.dcmp")]);
    let notified = notified_paths(&dropped);

    assert!(chosen.require(&notified[0]).is_ok());
}

#[test]
fn 選べないファイルも落とした綴りのまま落とした順に知らせる() {
    let dir = TempDir::new("drop-normal");
    let record_dir = TempDir::new("drop-normal-record");
    fs::write(dir.join("notes.txt"), "x").expect("落とすファイルを用意できる");
    fs::write(dir.join("document.dcmp"), "{}").expect("落とすファイルを用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let canonical = chosen
        .choose(&raw_document_path(&dir, "document.dcmp"))
        .expect("寄せた綴りを得られる");

    let dropped = accept_dropped(&chosen, &[dir.join("notes.txt"), dir.join("document.dcmp")]);

    assert_eq!(
        notified_paths(&dropped),
        vec![raw_document_path(&dir, "notes.txt"), canonical]
    );
}

// macOS は UTF-8 で表せない名前のファイルを作れないので Linux に限る。
#[cfg(target_os = "linux")]
#[test]
fn utf8で表せないパスは知らせから落とす() {
    use std::ffi::OsStr;
    use std::os::unix::ffi::OsStrExt;

    let dir = TempDir::new("drop-normal");
    let record_dir = TempDir::new("drop-normal-record");
    let not_utf8: PathBuf = dir.path().join(OsStr::from_bytes(b"bad\xff.dcmp"));
    let chosen = chosen_paths_in(&record_dir);

    // 対照に UTF-8 で表せるものを 1 件混ぜる。知らせる処理ごと壊れていても通る、を防ぐ。
    let dropped = accept_dropped(&chosen, &[not_utf8, dir.join("notes.txt")]);

    assert_eq!(
        notified_paths(&dropped),
        vec![raw_document_path(&dir, "notes.txt")]
    );
}
