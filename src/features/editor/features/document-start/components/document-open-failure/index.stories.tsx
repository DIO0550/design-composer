import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import { DocumentOpenFailureBanner } from "./index";

const MissingPath = "/work/settings-ui/app.dcmp";

const meta = {
  title: "features/editor/features/document-start/DocumentOpenFailureBanner",
  component: DocumentOpenFailureBanner,
  parameters: { layout: "fullscreen" },
  args: {
    failure: {
      kind: "io",
      error: DocumentAccessFailure.create("missing", MissingPath),
    },
  },
} satisfies Meta<typeof DocumentOpenFailureBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ファイルへ届かなかった状態。理由の 1 行と診断用の原文が並ぶ。 */
export const Unreachable: Story = {
  name: "ファイルが見つからない",
};

/**
 * ファイルを選べなかった状態（`.dcmp` 以外を選んだなど）。原文は Rust が返した綴りが
 * そのまま出る。
 */
export const DialogFailed: Story = {
  name: "ファイルを選べなかった",
  args: {
    failure: {
      kind: "dialog",
      error: {
        message: "/work/settings-ui/notes.txt: 拡張子が `.dcmp` ではない",
      },
    },
  },
};

/** このアプリで選ばれていないファイルを開こうとした状態。選び直す先を理由の 1 行で示す。 */
export const Unchosen: Story = {
  name: "このアプリで選ばれていない",
  args: {
    failure: {
      kind: "io",
      error: DocumentAccessFailure.create(
        "unchosen",
        `${MissingPath}: このアプリで選ばれていない`,
      ),
    },
  },
};

/**
 * 解釈できなかった状態。**帯には理由の 1 行しか出さない**（件数分だけ伸びるエラー一覧を
 * 3 ペインの上へ積むと、開いているドキュメントの表示領域を押し潰すため）。原文も持たない。
 */
export const Unparsable: Story = {
  name: "ドキュメントとして読み取れない",
  args: {
    failure: {
      kind: "unparsable",
      errors: [
        {
          kind: "syntax-error",
          message: "unexpected end of JSON input",
          location: { kind: "text-position", position: 19 },
        },
      ],
    },
  },
};
