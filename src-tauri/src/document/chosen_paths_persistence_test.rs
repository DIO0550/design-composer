//! 選ばれたパスの記録を、次の起動へ持ち越す(docs/05-architecture.md「選ばれたファイルの記録」)。
//!
//! 「次の起動」は、同じ記録ファイルから `ChosenDocumentPaths::restore` で読み戻すことで再現する。

use std::fs;

use crate::app_state;

use super::chosen_paths::{self, ChosenDocumentPaths, RECORDED_LIMIT};
use super::io::{load_requested, DocumentIoError};

use super::test_support::{chosen_paths_in, chosen_spelling, raw_document_path, TempDir};

/// `record_dir` の記録ファイルから読み戻す(次の起動を再現する)。
fn restarted(record_dir: &TempDir) -> ChosenDocumentPaths {
    chosen_paths_in(record_dir)
}

/// `dir` 配下の `doc-{n}.dcmp` を、`range` の順に選ぶ。
///
/// @returns 選んだときに返った綴り(選んだ順)
fn choose_many(
    chosen: &ChosenDocumentPaths,
    dir: &TempDir,
    range: std::ops::Range<usize>,
) -> Vec<String> {
    range
        .map(|index| chosen_spelling(chosen, dir, &format!("doc-{index}.dcmp")))
        .collect()
}

/// 記録ファイルの中身を、外の書き手が書いたものとして置く。
fn write_record(record_dir: &TempDir, content: &str) {
    fs::write(chosen_paths::record_path(record_dir.path()), content).expect("記録を書ける");
}

/// 記録ファイルの中身をバイト列のまま読む。
fn record_bytes(record_dir: &TempDir) -> Vec<u8> {
    fs::read(chosen_paths::record_path(record_dir.path())).expect("記録を読める")
}

fn is_not_chosen(chosen: &ChosenDocumentPaths, raw: &str) -> bool {
    matches!(chosen.require(raw), Err(DocumentIoError::NotChosen { .. }))
}

#[test]
fn 選んだパスは次の起動でも照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let spelling = chosen_spelling(&chosen_paths_in(&record_dir), &dir, "document.dcmp");

    let next = restarted(&record_dir);

    assert!(next.require(&spelling).is_ok());
}

#[test]
fn 記録が無ければ何も選ばれていない() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");

    let chosen = restarted(&record_dir);

    assert!(is_not_chosen(
        &chosen,
        &raw_document_path(&dir, "document.dcmp")
    ));
}

#[test]
fn 記録が壊れていれば中に書かれたパスも選ばれていない() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let raw = raw_document_path(&dir, "document.dcmp");
    // 末尾が切れた配列
    write_record(
        &record_dir,
        &format!("[{}", serde_json::Value::from(raw.as_str())),
    );

    let chosen = restarted(&record_dir);

    assert!(is_not_chosen(&chosen, &raw));
}

#[test]
fn 最近使ったファイルの一覧にだけあるパスは選ばれていない() {
    let dir = TempDir::new("chosen-persistence");
    let config_dir = TempDir::new("chosen-persistence-config");
    let raw = raw_document_path(&dir, "document.dcmp");
    let app_state = serde_json::json!({ "recentPaths": [raw] }).to_string();
    fs::write(app_state::state_path(config_dir.path()), app_state)
        .expect("app-state.json を書ける");

    let chosen = restarted(&config_dir);

    assert!(is_not_chosen(&chosen, &raw));
}

#[test]
fn 記録に外から書き足されたドキュメントのパスとして扱えない行は落とし残りの行は照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let raw = raw_document_path(&dir, "document.dcmp");
    let record = serde_json::json!([
        42,
        "relative.dcmp",
        raw_document_path(&dir, "notes.txt"),
        raw
    ]);
    write_record(&record_dir, &record.to_string());

    let chosen = restarted(&record_dir);

    assert!(chosen.require(&raw).is_ok());
}

#[test]
fn 上限を超えて選ぶと次の起動では古いものから外れる() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let spellings = choose_many(&chosen_paths_in(&record_dir), &dir, 0..RECORDED_LIMIT + 1);

    let next = restarted(&record_dir);

    assert!(is_not_chosen(&next, &spellings[0]));
    assert!(next.require(&spellings[1]).is_ok());
}

#[test]
fn 上限を超えて選んでも起動中は古いものも照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let chosen = chosen_paths_in(&record_dir);

    let spellings = choose_many(&chosen, &dir, 0..RECORDED_LIMIT + 1);

    assert!(chosen.require(&spellings[0]).is_ok());
}

#[test]
fn 読み込めたパスは並びの先頭へ移り新しく選んだものに押されても記録に残る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    fs::write(dir.join("doc-0.dcmp"), "{}").expect("読み込む対象を用意できる");
    let chosen = chosen_paths_in(&record_dir);
    let spellings = choose_many(&chosen, &dir, 0..RECORDED_LIMIT);

    load_requested(&chosen, &spellings[0]).expect("読み込みに成功する");
    choose_many(&chosen, &dir, RECORDED_LIMIT..RECORDED_LIMIT + 1);
    let next = restarted(&record_dir);

    assert!(next.require(&spellings[0]).is_ok());
    assert!(is_not_chosen(&next, &spellings[1]));
}

#[test]
fn 読み込めなかったパスは並びの先頭へ移らない() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    // doc-0.dcmp は置かないので読み込めない
    let chosen = chosen_paths_in(&record_dir);
    let spellings = choose_many(&chosen, &dir, 0..RECORDED_LIMIT);

    load_requested(&chosen, &spellings[0]).expect_err("読み込みに失敗する");
    choose_many(&chosen, &dir, RECORDED_LIMIT..RECORDED_LIMIT + 1);
    let next = restarted(&record_dir);

    assert!(is_not_chosen(&next, &spellings[0]));
}

#[test]
fn 外から上限を超えて書かれた記録は新しいものから上限の件数までが照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let raws: Vec<String> = (0..=RECORDED_LIMIT)
        .map(|index| raw_document_path(&dir, &format!("doc-{index}.dcmp")))
        .collect();
    write_record(
        &record_dir,
        &serde_json::Value::from(raws.clone()).to_string(),
    );

    let chosen = restarted(&record_dir);

    assert!(chosen.require(&raws[RECORDED_LIMIT - 1]).is_ok());
    assert!(is_not_chosen(&chosen, &raws[RECORDED_LIMIT]));
}

#[test]
fn 同じパスを2回選んでも記録では1件に数える() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let chosen = chosen_paths_in(&record_dir);
    let oldest = chosen_spelling(&chosen, &dir, "oldest.dcmp");
    chosen_spelling(&chosen, &dir, "twice.dcmp");
    chosen_spelling(&chosen, &dir, "twice.dcmp");
    // 重複を数えていれば、ここで上限を超えて最も古いものが記録から外れる
    choose_many(&chosen, &dir, 0..RECORDED_LIMIT - 2);

    let next = restarted(&record_dir);

    assert!(next.require(&oldest).is_ok());
}

#[test]
fn 記録が壊れていても選び直せば次の起動で照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    write_record(&record_dir, "[");
    let spelling = chosen_spelling(&restarted(&record_dir), &dir, "document.dcmp");

    let next = restarted(&record_dir);

    assert!(next.require(&spelling).is_ok());
}

#[test]
fn 読めない記録から起動したあとに選んでも記録ファイルは書き換わらない() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    // UTF-8 として読めない記録。中身を書き換えられたかをバイト列で比べる
    let unreadable: &[u8] = b"[\"\xff\"]";
    fs::write(chosen_paths::record_path(record_dir.path()), unreadable).expect("記録を書ける");
    let chosen = restarted(&record_dir);

    chosen_spelling(&chosen, &dir, "document.dcmp");

    assert_eq!(record_bytes(&record_dir), unreadable);
}

#[test]
fn 読めない記録から起動しても選んだパスは起動中なら照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    // 記録の場所をディレクトリにして、読めなくする
    fs::create_dir(chosen_paths::record_path(record_dir.path())).expect("ディレクトリを置ける");
    let chosen = restarted(&record_dir);

    let spelling = chosen_spelling(&chosen, &dir, "document.dcmp");

    assert!(chosen.require(&spelling).is_ok());
}

#[test]
fn 先頭にあるパスを選び直しても記録ファイルは書き換わらない() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let chosen = chosen_paths_in(&record_dir);
    chosen_spelling(&chosen, &dir, "document.dcmp");
    // 外から別の中身に置き換えておき、書き出せばこれが消えることで見分ける
    let replaced = serde_json::json!([raw_document_path(&dir, "other.dcmp")]).to_string();
    write_record(&record_dir, &replaced);

    chosen_spelling(&chosen, &dir, "document.dcmp");

    assert_eq!(record_bytes(&record_dir), replaced.as_bytes());
}

#[test]
fn 外から書かれた記録に同じ行が重なっていても1件に数えて復元する() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let raws: Vec<String> = (0..RECORDED_LIMIT)
        .map(|index| raw_document_path(&dir, &format!("doc-{index}.dcmp")))
        .collect();
    // 先頭の行を重ねて、行数だけなら上限を 1 件超える記録にする
    let rows: Vec<String> = std::iter::once(raws[0].clone())
        .chain(raws.iter().cloned())
        .collect();
    write_record(&record_dir, &serde_json::Value::from(rows).to_string());

    let chosen = restarted(&record_dir);

    assert!(chosen.require(&raws[RECORDED_LIMIT - 1]).is_ok());
}

#[test]
fn 上限を超えて選んでも記録ファイルに書く行は上限の件数まで() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let chosen = chosen_paths_in(&record_dir);

    choose_many(&chosen, &dir, 0..RECORDED_LIMIT + 1);

    // 読み戻す側も上限で切るので、次の起動の照合ではなく記録ファイルの中身を数える
    let recorded: Vec<String> =
        serde_json::from_slice(&record_bytes(&record_dir)).expect("記録は文字列の配列");
    assert_eq!(recorded.len(), RECORDED_LIMIT);
}

#[test]
fn 使えない行で上限の件数を埋めた記録でも後ろにある使える行は照合を通る() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let raw = raw_document_path(&dir, "document.dcmp");
    // 相対パスはドキュメントのパスとして扱えない。上限より先に落とさないと、使える行が切られる
    let unusable = (0..RECORDED_LIMIT).map(|index| format!("relative-{index}.dcmp"));
    let rows: Vec<String> = unusable.chain(std::iter::once(raw.clone())).collect();
    write_record(&record_dir, &serde_json::Value::from(rows).to_string());

    let chosen = restarted(&record_dir);

    assert!(chosen.require(&raw).is_ok());
}

#[test]
fn 上限の境目をまたいで重なった行は新しい側を数え上限から外れるのは後ろの行() {
    let dir = TempDir::new("chosen-persistence");
    let record_dir = TempDir::new("chosen-persistence-record");
    let newest = raw_document_path(&dir, "newest.dcmp");
    let last = raw_document_path(&dir, "last.dcmp");
    let between =
        (1..RECORDED_LIMIT).map(|index| raw_document_path(&dir, &format!("doc-{index}.dcmp")));
    // 新しい順の並び。先頭の行を末尾にも重ね、重なりを除くと `last` がちょうど上限の 1 つ外になる
    let rows: Vec<String> = std::iter::once(newest.clone())
        .chain(between)
        .chain([last.clone(), newest.clone()])
        .collect();
    write_record(&record_dir, &serde_json::Value::from(rows).to_string());

    let chosen = restarted(&record_dir);

    assert!(chosen.require(&newest).is_ok());
    assert!(is_not_chosen(&chosen, &last));
}
