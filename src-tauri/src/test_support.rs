//! テスト用の支援のうち、対象のモジュールをまたいで使うもの。
//!
//! 1 つのモジュールでしか使わないものは、そのモジュール配下の `test_support.rs` に置く。

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

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
