use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// 自アプリが書き込んだ内容を記録し、file watch が検知した変更が
/// 自書き込みによるものかを判定する。
///
/// 記録するのは内容そのものではなくハッシュ。判定に必要なのは同一性だけで、
/// ドキュメントサイズに比例したメモリを持つ必要が無いため。ハッシュは同一プロセス内の
/// 比較にしか使わないので、プロセスやバージョンをまたいだ安定性は要求しない。
#[derive(Debug, Default)]
pub struct SelfWriteRegistry {
    written: Mutex<HashMap<PathBuf, u64>>,
}

impl SelfWriteRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// `path` へ `content` を書き込んだことを記録する。
    pub fn record(&self, path: &Path, content: &str) {
        self.written()
            .insert(registry_key(path), hash_content(content));
    }

    /// `path` から読み出した `content` が、自アプリが最後に書き込んだ内容と一致するか。
    ///
    /// 記録は消費しない。OS は 1 回の書き込みに対して複数の変更イベントを出すことがあり、
    /// 消費すると 2 回目以降を外部変更と誤判定するため。外部が最後の自書き込みと
    /// 完全に同一の内容を書いた場合も真を返すが、内容が同一である以上リロードを
    /// 見送っても表示は変わらない。
    pub fn is_self_write(&self, path: &Path, content: &str) -> bool {
        self.written().get(&registry_key(path)) == Some(&hash_content(content))
    }

    /// `path` の記録を破棄する（watch の停止時など）。
    pub fn forget(&self, path: &Path) {
        self.written().remove(&registry_key(path));
    }

    /// ロックを取得する。
    ///
    /// 記録が壊れても後続の判定は「一致しない = 外部変更」に倒れるだけで、
    /// 余分なリロードが起きる以外の実害が無い。ここで panic させる価値は無いので、
    /// poisoning は無視して中身を取り出す。
    fn written(&self) -> std::sync::MutexGuard<'_, HashMap<PathBuf, u64>> {
        self.written
            .lock()
            .unwrap_or_else(|error| error.into_inner())
    }
}

/// 記録のキー。
///
/// `./doc.dcmp` と `doc.dcmp`、symlink 経由と実体のように、同じファイルを指す
/// 異なる表記で取りこぼさないよう正規化する。まだ存在しないパスなど正規化できない場合は、
/// 与えられたパスをそのまま使う。
fn registry_key(path: &Path) -> PathBuf {
    path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
}

fn hash_content(content: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    hasher.finish()
}
