#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::Arc;
use std::time::Duration;

use app_lib::document::known_content::KnownContentRegistry;
use app_lib::document::watch::{self, DocumentWatchers};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// ファイルシステムのイベントが届くまでの上限。
///
/// 通常は数ミリ秒で届く。負荷の高い CI で偶発的に落ちないよう余裕を持たせている。
const CHANGE_TIMEOUT: Duration = Duration::from_secs(10);

/// 「通知されないこと」を確かめるときの待ち時間。
///
/// 待って何も来ないことしか確かめられないため、テストが遅くなりすぎない範囲に留める。
const NO_CHANGE_TIMEOUT: Duration = Duration::from_secs(2);

/// 変更の通知をチャネルへ流す形で監視を開始する。
///
/// 実装が Tauri へイベントを発火する箇所だけをチャネルへの送信に差し替えることで、
/// アプリを起動せずに「いつ・何が通知されるか」を実物の watcher で検証できる。
pub fn watch_changes(
    watchers: &DocumentWatchers,
    known: &Arc<KnownContentRegistry>,
    path: &Path,
) -> Receiver<String> {
    let (sender, receiver) = mpsc::channel();
    watch::start(watchers, Arc::clone(known), path, move |content| {
        let _ = sender.send(content);
    })
    .expect("監視を開始できる");
    receiver
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

/// テスト用の一時ディレクトリ。Drop で中身ごと削除する。
pub struct TempDir {
    path: PathBuf,
}

impl TempDir {
    pub fn new(label: &str) -> Self {
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "design-composer-{}-{}-{}",
            label,
            std::process::id(),
            sequence
        ));
        fs::create_dir_all(&path).expect("一時ディレクトリを作成できる");
        Self { path }
    }

    pub fn join(&self, file_name: &str) -> PathBuf {
        self.path.join(file_name)
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// ディレクトリ直下のファイル名を並べる（一時ファイルの残留確認に使う）。
    pub fn file_names(&self) -> Vec<String> {
        let mut names: Vec<String> = fs::read_dir(&self.path)
            .expect("一時ディレクトリを読める")
            .map(|entry| {
                entry
                    .expect("エントリを読める")
                    .file_name()
                    .to_string_lossy()
                    .into_owned()
            })
            .collect();
        names.sort();
        names
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
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
