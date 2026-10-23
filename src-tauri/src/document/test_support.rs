use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::Arc;
use std::time::Duration;

use super::file_path::DocumentFilePath;
use super::io::DocumentIoError;
use super::known_content::KnownContentRegistry;
use super::watch::{self, DocumentWatchers};

// `document` のテストは `TempDir` を `super::test_support::TempDir` として読む。置き場を
// クレート共通へ移しても読む側の綴りが変わらないよう、ここから再 export する。
pub use crate::test_support::TempDir;

/// ファイルシステムのイベントが届くまでの上限。
///
/// 通常は数ミリ秒で届く。負荷の高い CI で偶発的に落ちないよう余裕を持たせている。
const CHANGE_TIMEOUT: Duration = Duration::from_secs(10);

/// 「通知されないこと」を確かめるときの待ち時間。
///
/// 待って何も来ないことしか確かめられないため、テストが遅くなりすぎない範囲に留める。
const NO_CHANGE_TIMEOUT: Duration = Duration::from_secs(2);

/// `dir` 配下の `relative`(`/` を含むサブパスも可)を、webview がコマンドへ渡す生の
/// パス文字列として返す。
pub fn raw_document_path(dir: &TempDir, relative: &str) -> String {
    dir.join(relative)
        .to_str()
        .expect("一時ディレクトリのパスは UTF-8")
        .to_string()
}

/// `dir` 配下の `relative`(`/` を含むサブパスも可)を、ドキュメントのパスとして受け付けた
/// 形で返す。
pub fn document_file_path(dir: &TempDir, relative: &str) -> DocumentFilePath {
    DocumentFilePath::parse(&raw_document_path(dir, relative))
        .expect("ドキュメントのパスとして受け付けられる")
}

/// 変更の通知をチャネルへ流す形で監視を開始する。
///
/// 実装が Tauri へイベントを発火する箇所だけをチャネルへの送信に差し替えることで、
/// アプリを起動せずに「いつ・何が通知されるか」を実物の watcher で検証できる。
pub fn watch_changes(
    watchers: &DocumentWatchers,
    known: &Arc<KnownContentRegistry>,
    path: &DocumentFilePath,
) -> Receiver<String> {
    let (sender, receiver) = mpsc::channel();
    watch::start(watchers, Arc::clone(known), path, move |content| {
        let _ = sender.send(content);
    })
    .expect("監視を開始できる");
    receiver
}

/// webview から渡された綴りのまま監視を依頼し、`document-changed` のペイロードを
/// JSON 文字列にしてチャネルへ流す。
///
/// @returns 監視の開始の成否と、ペイロードを受け取るチャネル
pub fn watch_requested_payloads(
    watchers: &DocumentWatchers,
    known: &Arc<KnownContentRegistry>,
    raw_path: &str,
) -> (Result<(), DocumentIoError>, Receiver<String>) {
    let (sender, receiver) = mpsc::channel();
    let started = watch::start_requested(watchers, Arc::clone(known), raw_path, move |payload| {
        let json = serde_json::to_string(&payload).expect("ペイロードを JSON にできる");
        let _ = sender.send(json);
    });
    (started, receiver)
}

/// 次に通知された内容を待って返す。
pub fn next_change(receiver: &Receiver<String>) -> String {
    receiver
        .recv_timeout(CHANGE_TIMEOUT)
        .expect("変更が通知される")
}

/// 通知が来ないことを確かめる。
pub fn assert_no_change(receiver: &Receiver<String>) {
    match receiver.recv_timeout(NO_CHANGE_TIMEOUT) {
        // 監視が止まると送信側が破棄されるので、切断も「通知が来ない」に含める。
        Err(RecvTimeoutError::Timeout | RecvTimeoutError::Disconnected) => {}
        Ok(content) => panic!("通知されないはずが通知された: {content}"),
    }
}

/// テスト用のドキュメント（生の JSON 文字列）を組み立てる。
///
/// `entry_count` を大きくすると、アトミックでない書き込みでは
/// 途中状態が観測できる程度の大きさになる。
pub fn document(marker: &str, entry_count: usize) -> String {
    let entries: Vec<String> = (0..entry_count)
        .map(|index| format!(r#"{{"name":"{marker}-{index}","type":"Box"}}"#))
        .collect();
    format!(
        r#"{{"marker":"{}","children":[{}]}}"#,
        marker,
        entries.join(",")
    )
}
