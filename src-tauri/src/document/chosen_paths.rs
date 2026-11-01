//! 利用者が選んだドキュメントのパスの記録。
//!
//! ドキュメントの 4 コマンド(`load_document` / `save_document` / `watch_document` /
//! `unwatch_document`)が受け付けるのは、利用者がダイアログで選んだ・ウィンドウへ落とした・
//! 過去にそうして記録に残っているパスだけ(`docs/05-architecture.md`「選ばれたファイルの記録」)。
//! 記録を書くのは Rust だけで、webview から足す口は持たない。

use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use crate::file_io;

use super::canonical_path::canonicalize_requested;
use super::file_path::DocumentFilePath;
use super::io::DocumentIoError;

/// 設定ディレクトリに置く記録ファイルの名前。
const FILE_NAME: &str = "chosen-documents.json";

/// 記録ファイルに残す件数の上限(新しいものから数える)。
const RECORDED_LIMIT: usize = 50;

/// 設定ディレクトリの下の記録ファイルの置き場。
pub fn record_path(config_dir: &Path) -> PathBuf {
    config_dir.join(FILE_NAME)
}

/// 利用者が選んだことの照合を通ったパス。
///
/// 作れるのは `ChosenDocumentPaths::require` だけで、ドキュメントの読み書き・監視は
/// この型しか受け取らない。形の検査だけを通った `DocumentFilePath` からは作れない。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChosenDocumentPath(DocumentFilePath);

impl ChosenDocumentPath {
    /// 照合を通ったときの綴り(webview から渡された綴りそのもの)。
    pub fn spelling(&self) -> String {
        self.0.to_string_lossy().into_owned()
    }
}

impl Deref for ChosenDocumentPath {
    type Target = Path;

    fn deref(&self) -> &Path {
        &self.0
    }
}

impl AsRef<Path> for ChosenDocumentPath {
    fn as_ref(&self) -> &Path {
        &self.0
    }
}

/// 利用者が選んだパスの集合と、それを残す記録ファイル。
///
/// メモリ上の並びは新しい順・重複なしで、件数の上限を持たない。上限を持たせると、タブを
/// 多く開いたときに古いタブの自動保存が `NotChosen` になる。上限は記録ファイルにだけ掛ける。
#[derive(Debug)]
pub struct ChosenDocumentPaths {
    chosen: Mutex<Vec<String>>,
    record_file: PathBuf,
}

impl ChosenDocumentPaths {
    /// 記録ファイルから、前回までに選ばれたパスを読み戻す。
    ///
    /// @param record_file 記録ファイルの置き場。以後の書き出しもここへ行う
    /// @returns 記録にあったパスを選ばれたものとして持つ集合。記録が無い・読めない・
    /// JSON の配列として読めないときは空。ドキュメントのパスとして扱えない行(文字列でない
    /// 行を含む)は落とし、重複は先に現れた側(新しい側)を残して、上限の件数までを持つ
    pub fn restore(record_file: PathBuf) -> Self {
        // 読めない記録を失敗として返さないのは、記録が欠けても選び直せば済み、起動を
        // 止める理由にならないため(`app_state` と同じく、壊れても作り直せるものを置く先)。
        let chosen = file_io::read_optional_text(&record_file)
            .ok()
            .flatten()
            .map(|text| recorded_paths(&text))
            .unwrap_or_default();
        Self {
            chosen: Mutex::new(chosen),
            record_file,
        }
    }

    /// 利用者が選んだパスを、寄せた綴りで集合の先頭に載せて記録へ書き出す。
    ///
    /// @param raw_path ダイアログ・ドロップが返したパス
    /// @returns 載せた綴り(`canonicalize_requested` で寄せた綴り)。寄せられないときは
    /// `InvalidPath` を返し、集合にも記録にも触れない
    pub fn choose(&self, raw_path: &str) -> Result<String, DocumentIoError> {
        let canonical = canonicalize_requested(raw_path)?;
        let spelling = canonical.to_string_lossy().into_owned();
        self.bring_to_front(&spelling);
        Ok(spelling)
    }

    /// webview から渡されたパスを検査し、選ばれた集合にある綴りかを照合する。
    ///
    /// 照合は綴りの完全一致で、同じファイルを指す別の綴りは通さない。
    ///
    /// @returns 照合を通ったパス。形の検査を通らないときは `InvalidPath`、集合に同じ綴りが
    /// 無いときは `NotChosen`
    pub fn require(&self, raw_path: &str) -> Result<ChosenDocumentPath, DocumentIoError> {
        let path = DocumentFilePath::parse(raw_path)?;
        let is_chosen = self.chosen().iter().any(|chosen| chosen == raw_path);
        if !is_chosen {
            return Err(DocumentIoError::not_chosen(&path));
        }
        Ok(ChosenDocumentPath(path))
    }

    /// 読み込めたパスを集合の先頭へ移し、記録へ書き出す。
    ///
    /// 常用しているファイルが、新しく選んだものに押されて記録の上限から外れないようにする。
    pub fn record_opened(&self, path: &ChosenDocumentPath) {
        self.bring_to_front(&path.spelling());
    }

    /// `spelling` を集合の先頭に置き、記録へ書き出す。
    ///
    /// 書き出しはロックを持ったまま行い、並びと記録ファイルの中身が書き出しの順でずれない
    /// ようにする。
    fn bring_to_front(&self, spelling: &str) {
        let mut chosen = self.chosen();
        let reordered = with_front(&chosen, spelling);
        *chosen = reordered;
        // 書き出しの失敗は返さない。起動中の照合はメモリの集合で続き、失われるのは次の起動で
        // 選び直さずに開けることだけなので、選ぶ・開く操作そのものを失敗にしない。
        let _ = file_io::write_text(&self.record_file, &recorded_text(&chosen));
    }

    /// ロックを取得する。
    ///
    /// 並びの更新は 1 回の代入なので、途中で panic しても並びが壊れることはない。
    /// poisoning は無視して中身を取り出す。
    fn chosen(&self) -> MutexGuard<'_, Vec<String>> {
        self.chosen
            .lock()
            .unwrap_or_else(|error| error.into_inner())
    }
}

/// `spelling` を先頭に置き、残りを元の順で後ろへ並べる。
fn with_front(paths: &[String], spelling: &str) -> Vec<String> {
    let rest = paths
        .iter()
        .filter(|path| path.as_str() != spelling)
        .cloned();
    std::iter::once(spelling.to_string()).chain(rest).collect()
}

/// 記録ファイルの中身を、選ばれたパスの並びとして読む。
///
/// @returns ドキュメントのパスとして扱える文字列の行だけを、重複を除いて上限の件数まで。
/// JSON の配列として読めなければ空
fn recorded_paths(text: &str) -> Vec<String> {
    let Ok(rows) = serde_json::from_str::<Vec<serde_json::Value>>(text) else {
        return Vec::new();
    };
    let usable: Vec<&str> = rows
        .iter()
        .filter_map(serde_json::Value::as_str)
        .filter(|row| DocumentFilePath::parse(row).is_ok())
        .collect();
    usable
        .iter()
        .enumerate()
        .filter(|(index, row)| !usable[..*index].contains(row))
        .map(|(_, row)| row.to_string())
        .take(RECORDED_LIMIT)
        .collect()
}

/// 記録ファイルへ書く中身。新しいものから上限の件数までを JSON の配列にする。
fn recorded_text(paths: &[String]) -> String {
    let recorded: Vec<String> = paths.iter().take(RECORDED_LIMIT).cloned().collect();
    serde_json::Value::from(recorded).to_string()
}
