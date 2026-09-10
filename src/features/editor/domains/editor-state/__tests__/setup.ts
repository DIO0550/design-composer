import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * `home` に Text の `title` と、`body-text` を抱えた Box の `body` が並ぶ状態。
 *
 * 入れ子を 1 段持たせているのは、削除がサブツリーごと消すことを平らな並びでは
 * 確かめられないため（`body` を消すと `body-text` も消える）。履歴のテストも
 * この状態を使うが、そちらが動かすのは葉なので入れ子には依らない。
 *
 * @returns その並びを持つエディタの状態
 */
export function stateWithNestedBox(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            {
              name: "body",
              type: "Box",
              children: [{ name: "body-text", type: "Text" }],
            },
          ],
        },
      ],
    }),
  );
}

/**
 * `home` に Text を 2 つ持ち、部品定義は雛形のものをそのまま使う状態（`primary-button-label`
 * が部品定義の中のノードにあたる）。
 *
 * 部品定義まで持たせてあるのは、`DesignDocument.collectErrors` が部品定義も走査する一方
 * で、選択の対象は artboard 配下だけ、という差を持つ状態が要るため（#136）。
 *
 * **いま、その差を落としても落ちるテストは無い**（部品定義を外しても reveal / revert の
 * 全件が通る。飛び先にならないことを固定する assert が reveal 側に無いため）。呼び出し
 * 側がこの形に依存していると読まないこと。
 *
 * @returns artboard 配下に Text を 2 つ、雛形の部品定義を持つエディタの状態
 */
export function stateWithComponentDefinitions(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text", props: { content: "ホーム" } },
            { name: "home-lead", type: "Text", props: { content: "ようこそ" } },
          ],
        },
      ],
    }),
  );
}

/**
 * `home` に 3 階層の枝（`outer-panel` > `inner-panel` > `deep-title`）と、
 * その兄弟の `sibling-panel`、部品インスタンスの `home-login` が並ぶ状態。
 *
 * 3 階層あるのは、キャンバスのクリックが選ぶ階層（docs/06-ui.md）を確かめるのに
 * **いちばん外側・1 つ内側・いちばん内側がすべて別の名前**でなければならないため。
 * 2 階層だと「artboard 直下の子」と「いちばん内側」が同じ名前になり、掘る量を
 * 取り違えた実装でも同じ答えが出る。
 *
 * @returns その並びを持つエディタの状態
 */
export function stateWithDeepBranch(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "outer-panel",
              type: "Box",
              children: [
                {
                  name: "inner-panel",
                  type: "Box",
                  children: [{ name: "deep-title", type: "Text" }],
                },
              ],
            },
            { name: "sibling-panel", type: "Box", children: [] },
            { name: "home-login", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

/**
 * `stateWithDeepBranch` の `deep-title` を押したときにキャンバスから届く候補
 * （押された要素から外へ辿った名前）。
 */
export const DeepTitleNames = [
  "deep-title",
  "inner-panel",
  "outer-panel",
  "home",
] as const;

/**
 * `stateWithDeepBranch` の部品インスタンスの中身を押したときに届く候補。
 * 先頭の `primary-button-label` は部品定義の中のノードなので選択の対象にならない。
 */
export const InstanceNames = [
  "primary-button-label",
  "home-login",
  "home",
] as const;

/**
 * 名前で引いたノード。見つからなければテストを落とす。
 *
 * @param state 引き先のエディタの状態
 * @param name 引きたいノードの名前
 * @returns そのノード
 */
export function nodeNamed(state: EditorState, name: string): Node {
  return Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

/**
 * 名前で指した親の子の並び。artboard もノードも「子を持つもの」として同じに見る。
 *
 * @param state 引き先のエディタの状態
 * @param parentName 子を読みたい artboard / ノードの名前
 * @returns その子の名前を並び順のまま。親が居なければテストを落とす
 */
export function childNames(
  state: EditorState,
  parentName: string,
): readonly string[] {
  return Option.unwrap(
    DesignDocument.findChildren(EditorState.document(state), parentName),
  ).map((child) => child.name);
}
