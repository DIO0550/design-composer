import { Node, type Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * ノードをキャンバスの直接操作から外すかどうかを名前で指すための対応表（docs/03「ロック」）。
 * Figma のレイヤーごとのロックにあたる。
 *
 * 真偽値にしない理由は `Visibilities` と同じ。
 */
export const Lockings = {
  Unlocked: "unlocked",
  Locked: "locked",
} as const;

/** ノードをキャンバスの直接操作から外すかどうか。 */
export type Locking = ValueOf<typeof Lockings>;

export const Locking = {
  /**
   * 書かれていないノードに効くロック。
   * スキーマの `default` もここを引くので、既定の出どころは 1 つ。
   */
  Default: Lockings.Unlocked,

  /**
   * props からロックを読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns ロック。未設定・語彙に無い綴りのときは既定（`Default`）
   *   （不正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Locking {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(Lockings), props.locking),
      Locking.Default,
    );
  },

  /**
   * ノード自身に書かれたロックを読む（祖先から継ぐぶんは見ない）。
   *
   * @param node 読み取り元のノード
   * @returns ロック。部品インスタンスは参照ノード直下の `locking` だけを読み、部品の根の
   *   `locking` は読まない（docs/03-schema.md「ロック」）。未設定・語彙に無い綴りのときは既定
   */
  fromNode(node: Node): Locking {
    return Locking.fromProps(
      Node.isRef(node) ? Node.refOwnPropsOf(node) : Node.propsOf(node),
    );
  },
} as const;
