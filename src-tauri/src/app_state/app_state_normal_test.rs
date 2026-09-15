use std::path::Path;

use super::state_path;

#[test]
fn 設定ディレクトリの下が置き場になる() {
    assert_eq!(
        state_path(Path::new("/config/design-composer")),
        Path::new("/config/design-composer/app-state.json")
    );
}
