use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use notify::{ErrorKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{new_debouncer, DebounceEventResult, Debouncer};

use crate::document_io::DocumentIoError;

/// 変更が落ち着くのを待つ時間。
///
/// 外部の書き手が `fs::write` のように「切り詰めてから書く」場合、書き終わる前に
/// 変更イベントが届く。そのまま読むと空や途中までの内容を外部変更として配ってしまうため、
/// イベントが止まってから読む。Rust は .dcmp の構造を知らない(`docs/05-architecture.md`
/// 「Tauri IPC」)ので、内容が揃ったかを解析で判定することはできず、時間で待つしかない。
///
/// 書き込みの完了はミリ秒未満なので、この長さがあれば途中状態はまず読まない。
/// 書き手がこれを超えて止まった場合は途中の内容が届きうるが、その場合は
/// 「読み込んだ内容が不正」として JS 側がエラー表示を出す(同「外部編集の検知」)。
const SETTLE_TIMEOUT: Duration = Duration::from_millis(200);

/// 稼働中の file watcher を監視対象のパスごとに保持する。
///
/// `notify` の watcher は drop で監視を止めるため、保持をやめること自体が停止になる。
#[derive(Default)]
pub struct DocumentWatchers {
    active: Mutex<HashMap<PathBuf, Debouncer<RecommendedWatcher>>>,
}

impl DocumentWatchers {
    pub fn new() -> Self {
        Self::default()
    }

    /// `path` の変更を監視し、変更が落ち着くたびに `on_change` を呼ぶ。
    ///
    /// 同じパスに対して二重に呼ばれた場合は古い watcher を破棄して張り直すので、
    /// 1 つのパスに watcher が 2 つ走って通知が重複することはない。
    pub fn watch(
        &self,
        path: &Path,
        on_change: impl Fn() + Send + 'static,
    ) -> Result<(), DocumentIoError> {
        // 監視するのはファイルではなく親ディレクトリ。`save_document` のアトミック書き込みも
        // 多くのエディタの保存も rename でファイルを差し替えるため、ファイル自身に watch を
        // 張ると inode ごと差し替わって 2 回目以降のイベントが届かなくなる。
        let watched = path
            .canonicalize()
            .map_err(|error| DocumentIoError::from_io(path, &error))?;
        let directory = watched
            .parent()
            .ok_or_else(|| DocumentIoError::invalid_path(path, "親ディレクトリを持たない"))?
            .to_path_buf();

        let target = watched.clone();
        let mut debouncer = new_debouncer(SETTLE_TIMEOUT, move |result: DebounceEventResult| {
            // watch 自体の失敗を JS へ配らないのは、`docs/05-architecture.md` の IPC 表が
            // イベントとして `document-changed` しか定義しておらず、エラーを届ける経路が
            // 仕様に無いため。経路の新設は #27 の範囲外。
            let Ok(events) = result else {
                return;
            };
            // 親ディレクトリを監視しているので、対象ファイル以外の変更も届く。
            // アトミック書き込みの一時ファイルもここで落ちる。
            if events.iter().any(|event| event.path == target) {
                on_change();
            }
        })
        .map_err(|error| watch_error(path, &error))?;

        debouncer
            .watcher()
            .watch(&directory, RecursiveMode::NonRecursive)
            .map_err(|error| watch_error(path, &error))?;

        self.active().insert(watched, debouncer);
        Ok(())
    }

    /// `path` の監視を止める。監視していないパスに対しては何もしない(停止操作は冪等)。
    pub fn unwatch(&self, path: &Path) {
        let key = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
        self.active().remove(&key);
    }

    /// ロックを取得する。
    ///
    /// poisoning を無視するのは `KnownContentRegistry` と同じ理由で、ここで panic させても
    /// 監視が復旧しないため。中身を取り出して監視の登録 / 解除を続行させる。
    fn active(&self) -> std::sync::MutexGuard<'_, HashMap<PathBuf, Debouncer<RecommendedWatcher>>> {
        self.active
            .lock()
            .unwrap_or_else(|error| error.into_inner())
    }
}

/// `notify` の失敗を、JS 側が既に扱っている I/O の語彙へ寄せる。
///
/// watch 専用の失敗種別を増やさないのは、監視の開始に失敗する原因(パス不正・権限・
/// inotify の上限)が JS 側から見ればいずれも「そのファイルを扱えない」であり、
/// 分岐の仕方が `load_document` / `save_document` の失敗と変わらないため。
fn watch_error(path: &Path, error: &notify::Error) -> DocumentIoError {
    match &error.kind {
        ErrorKind::Io(source) => DocumentIoError::from_io(path, source),
        _ => DocumentIoError::io(path, &error.to_string()),
    }
}
