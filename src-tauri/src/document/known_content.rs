use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// アプリが把握しているファイルの内容を記録し、file watch が検知した変更を
/// JS 側へ通知すべきかを判定する。
///
/// 判定を「誰が書いたか」ではなく「内容が把握済みと同じか」で行うことで、
/// 自アプリの書き込みによる自己ループの防止と、OS が 1 回の書き込みに対して
/// 複数の変更イベントを出すことによる重複通知の抑止が、同じ 1 つの記録で足りる。
///
/// 記録するのは内容そのものではなくハッシュ。判定に必要なのは同一性だけで、
/// ドキュメントサイズに比例したメモリを持つ必要が無いため。ハッシュは同一プロセス内の
/// 比較にしか使わないので、プロセスやバージョンをまたいだ安定性は要求しない。
#[derive(Debug, Default)]
pub struct KnownContentRegistry {
    known: Mutex<HashMap<PathBuf, u64>>,
}

impl KnownContentRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// `path` の内容が `content` であることを記録する。
    pub fn record(&self, path: &Path, content: &str) {
        self.known()
            .insert(registry_key(path), hash_content(content));
    }

    /// `path` へ `content` を書き込む `write` を、記録と不可分に実行する。
    ///
    /// 記録が書き込みより後にずれると、その隙間に file watch がファイルを読んで
    /// 自アプリの書き込みを外部変更と誤判定する(#27 の自己ループ)。file watch は
    /// 別スレッドで動くため、記録を書き込みの前に置いて隙間そのものを無くす。
    ///
    /// 書き込みが失敗したときに元の記録へ戻すのは、ファイルに現れていない内容を
    /// 把握済みのまま残すと、後から外部が同じ内容を書いたときに見落とすため。
    pub fn record_write<E>(
        &self,
        path: &Path,
        content: &str,
        write: impl FnOnce() -> Result<(), E>,
    ) -> Result<(), E> {
        let key = registry_key(path);
        let previous = self.known().insert(key.clone(), hash_content(content));

        let Err(error) = write() else {
            return Ok(());
        };

        match previous {
            Some(hash) => self.known().insert(key, hash),
            None => self.known().remove(&key),
        };
        Err(error)
    }

    /// `path` から読み出した `content` が、アプリの把握している内容と一致するか。
    ///
    /// 記録は消費しない。OS は 1 回の書き込みに対して複数の変更イベントを出すことがあり、
    /// 消費すると 2 回目以降を外部変更と誤判定するため。外部が把握済みと完全に同一の
    /// 内容を書いた場合も真を返すが、内容が同一である以上リロードを見送っても
    /// 表示は変わらない。
    pub fn is_known(&self, path: &Path, content: &str) -> bool {
        self.known().get(&registry_key(path)) == Some(&hash_content(content))
    }

    /// `path` の記録を破棄する(watch の停止時など)。
    pub fn forget(&self, path: &Path) {
        self.known().remove(&registry_key(path));
    }

    /// ロックを取得する。
    ///
    /// 記録が壊れても後続の判定は「一致しない = 外部変更」に倒れるだけで、
    /// 余分なリロードが起きる以外の実害が無い。ここで panic させる価値は無いので、
    /// poisoning は無視して中身を取り出す。
    fn known(&self) -> std::sync::MutexGuard<'_, HashMap<PathBuf, u64>> {
        self.known.lock().unwrap_or_else(|error| error.into_inner())
    }
}

/// 記録のキー。
///
/// `./doc.dcmp` と `doc.dcmp`、symlink 経由と実体のように、同じファイルを指す
/// 異なる表記で取りこぼさないよう正規化する。
fn registry_key(path: &Path) -> PathBuf {
    if let Ok(canonical) = path.canonicalize() {
        return canonical;
    }

    // ファイルがまだ存在しない場合は canonicalize できない。新規ファイルへの
    // `record_write` は書き込み前に記録するのでここを通り、書き込み後の問い合わせは
    // 上の分岐を通る。両者が同じキーになるよう、親ディレクトリだけを正規化して組み立てる。
    let (Some(parent), Some(file_name)) = (path.parent(), path.file_name()) else {
        return path.to_path_buf();
    };
    let parent = if parent.as_os_str().is_empty() {
        Path::new(".")
    } else {
        parent
    };
    match parent.canonicalize() {
        Ok(directory) => directory.join(file_name),
        Err(_) => path.to_path_buf(),
    }
}

fn hash_content(content: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    hasher.finish()
}
