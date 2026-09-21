import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import type { Offset } from "@/domains/unit/offset";

/**
 * 自動配置する artboard を横に並べるときの間隔（px）。
 *
 * UI 案（docs/Design Composer.html）は artboard を 400×500 に縮めて描いており、実測の間隔
 * 30px は文書座標では約 54px にあたる。そこへ寄せるのは `rules/ui-verification.md`「乖離の
 * 解消は個別の issue で行う」に従い別に扱う。
 */
const AutoArrangeGap = 32;

/**
 * 自動配置する artboard の上端。
 *
 * 座標を持つ artboard の `y` が原点から測られるので、自動配置だけ余白ぶん下げると 2 つの起
 * 点が食い違う。
 */
const AutoArrangeTop = 0;

/**
 * 置き場所が決まった artboard。
 *
 * `CompiledArtboard` の位置は省略されうる（ファイルに書かれていない artboard がある）が、
 * 描く側は必ずどこかへ置くので、**位置が決まったこと**を必須のフィールドで表す
 * (`rules/coding.md`「処理の通過を型に刻む」)。
 *
 * これがあると、置き場所を決めていない artboard を描く関数へ渡せない。
 */
export type ArrangedArtboard = Readonly<{
  artboard: CompiledArtboard;
  canvasPosition: Offset;
}>;

/** 並び全体が占める大きさ。器に大きさを与えるために使う。 */
export type ArrangedSize = Readonly<{ width: number; height: number }>;

/**
 * 置き場所を決めるのに要る大きさと座標だけを持つ artboard。
 *
 * `Artboard` と `CompiledArtboard` の両方が満たす。コンパイルは並び順を保ち、1 枚でも
 * 失敗したら全体が失敗する（`DocumentHtml.compile`）ので、どちらの並びで数えても同じ
 * index が同じ artboard を指す。
 */
type PlaceableArtboard = Readonly<{
  width: number;
  canvasPosition?: Offset;
}>;

export const ArrangedArtboard = {
  /**
   * 並び全体の置き場所を決める。座標を持つ artboard はその座標へ置き、持たない artboard
   * は**既定の位置**（自分より前の artboard の幅 + 間隔の累積）へ置く。
   *
   * 自動配置されたものが座標を持つものに重なることはある。Figma もフレーム同士の重なり
   * を禁じていないので、避けずに受け入れている。
   *
   * @param artboards コンパイル済みの artboard の並び（`.dcmp` の並び順）
   * @returns 元の並び順のまま、それぞれの置き場所を添えたもの
   */
  fromArtboards(
    artboards: readonly CompiledArtboard[],
  ): readonly ArrangedArtboard[] {
    return artboards.map((artboard, index) => ({
      artboard,
      canvasPosition: ArrangedArtboard.positionAt(artboards, index),
    }));
  },

  /**
   * 並びの中の 1 枚が置かれる位置。座標を持つならその座標、持たないなら既定の位置
   * （自分より前の artboard の幅 + 間隔の累積）。
   *
   * `fromArtboards` もここを通すので、座標を持たないときの既定が 2 箇所へ散らない。
   *
   * @param artboards 大きさと座標を持つ artboard の並び（`.dcmp` の並び順）
   * @param index 位置を知りたい artboard が並びの何番目か
   * @returns その artboard が置かれる位置
   */
  positionAt(artboards: readonly PlaceableArtboard[], index: number): Offset {
    const placed = artboards[index].canvasPosition;
    if (placed !== undefined) {
      return placed;
    }
    const left = artboards
      .slice(0, index)
      .reduce(
        (accumulated, before) => accumulated + before.width + AutoArrangeGap,
        0,
      );
    return { x: left, y: AutoArrangeTop };
  },

  /**
   * 並び全体が占める大きさ。
   *
   * 絶対配置にすると器が内容の大きさを失うので、代わりに与えるために使う。
   * 器の大きさは**リサイズ中のポインタを受ける範囲**を決めるので、0 のままだと
   * 辺を外へ引いたときに追従が切れる（受け口は `ArtboardCanvas` 側にある）。
   *
   * 原点より左・上へはみ出したぶんは数えない。器は原点から広がるので、
   * 負の側へ伸ばしても受ける範囲は増えない。
   *
   * @param arranged 置き場所が決まった artboard の並び
   * @returns 原点から右下端までの大きさ。1 枚も無ければ幅も高さも 0
   */
  size(arranged: readonly ArrangedArtboard[]): ArrangedSize {
    const rights = arranged.map(
      ({ artboard, canvasPosition }) => canvasPosition.x + artboard.width,
    );
    const bottoms = arranged.map(
      ({ artboard, canvasPosition }) => canvasPosition.y + artboard.height,
    );
    return {
      width: Math.max(0, ...rights),
      height: Math.max(0, ...bottoms),
    };
  },
} as const;
