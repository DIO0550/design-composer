import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScreenHeightShell } from "@/components/__stories__/screen-height-shell";
import { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import { CommandSources } from "@/features/document-start/hooks/use-document-session";
import { Option } from "@/utils/Option";
import { DocumentStart } from "./index";

/** 押しても何も起きない導線。絵だけを見るストーリーなので動きは要らない。 */
const Actions = {
  openDocument: () => {},
  createDocument: () => {},
  openDocumentAt: () => {},
};

/** 保存先が決まるまで実物では空だが、一覧の見え方はここで確かめる（#376）。 */
const RecentPaths = [
  "/work/settings-ui/app.dcmp",
  "/work/shop/app.dcmp",
  "/work/design-system/tokens.dcmp",
];

const meta = {
  title: "features/documentStart/DocumentStart",
  component: DocumentStart,
  parameters: { layout: "fullscreen" },
  args: {
    session: { kind: "closed" },
    actions: Actions,
    recentPaths: [],
    commandFailure: Option.none,
    renderErrors: () => null,
  },
  // 開始画面は高さを親に合わせるので、素の `#storybook-root` へ直接描くと潰れる。
  decorators: [
    (Story) => (
      <ScreenHeightShell>
        <Story />
      </ScreenHeightShell>
    ),
  ],
} satisfies Meta<typeof DocumentStart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 何も開いていない状態。最近使ったファイルがまだ 1 件も無い。 */
export const Default: Story = {
  name: "開始画面",
};

/** 最近使ったファイルが並んでいる状態。同名のファイルはフォルダ名で見分ける。 */
export const WithRecentDocuments: Story = {
  name: "最近使ったファイルがある",
  args: { recentPaths: RecentPaths },
};

/** 選んだファイルを読み込んでいる間。開く / 新規作成は押せない。 */
export const Opening: Story = {
  name: "読み込み中",
  args: { session: { kind: "opening" } },
};

/** 開こうとしたファイルが読めなかった状態。 */
export const OpenFailed: Story = {
  name: "開けなかった",
  args: {
    session: {
      kind: "failed",
      failure: {
        kind: "io",
        error: DocumentAccessFailure.create(
          "missing",
          "/work/settings-ui/app.dcmp",
        ),
      },
    },
  },
};

/** メニューの購読を張れなかった状態（Tauri 側と版がずれたときなど）。 */
export const EntryUnavailable: Story = {
  name: "メニューを受け取れない",
  args: {
    commandFailure: Option.some({
      source: CommandSources.Menu,
      message: "listen が失敗した",
    }),
  },
};
