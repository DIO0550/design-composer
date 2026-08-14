import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  DocumentErrorList,
  type DocumentErrorListProps,
  DocumentErrorOrigins,
} from "./index";

/*
 * `StoryObj<typeof meta>` ではなく `StoryObj<typeof DocumentErrorList>` を使う。
 * props が由来ごとの直和なので、meta 経由だと args が全変種の交差になり
 * どの変種の args も渡せなくなる（#136）。
 *
 * ただしこちらは args が `Partial` になり、必須の args を落としても `tsc` が通る。
 * 各 story の args に `satisfies DocumentErrorListProps` を付けて欠落を弾く。
 */
const meta = {
  title: "features/editor/DocumentErrorList",
  component: DocumentErrorList,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      // 中央ペインと同じく、重ね合わせの基準を持つ器に入れて確認する。
      <div className="relative h-96 w-full bg-gray-100 p-4 text-gray-500 text-sm">
        最後に正常だったレンダリング
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentErrorList>;

export default meta;

type Story = StoryObj<typeof DocumentErrorList>;

export const BrokenJson: Story = {
  name: "JSON が壊れている",
  args: {
    origin: DocumentErrorOrigins.OpenedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: false,
    errors: [
      {
        kind: "syntax-error",
        message: "expected ',' or '}'",
        location: { kind: "text-position", position: 142 },
      },
    ],
  } satisfies DocumentErrorListProps,
};

/**
 * 場所の持ち方が 4 種類そろう。`Reveal` が出るのはノードを指す 2 件だけで、
 * 出し分けがそのまま見える（#136）。
 */
export const SchemaErrors: Story = {
  name: "スキーマ違反が複数",
  args: {
    origin: DocumentErrorOrigins.OpenedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: false,
    errors: [
      {
        kind: "unknown-prop",
        message: 'unknown prop "colour"',
        location: { kind: "node", nodeName: "home-title", prop: "colour" },
      },
      {
        kind: "dangling-ref",
        message: 'unknown component "missing-button"',
        location: { kind: "node", nodeName: "home-login" },
      },
      {
        kind: "invalid-type",
        message: "expected number but got string",
        location: { kind: "document-path", path: "artboards[0].width" },
      },
      {
        kind: "unsupported-format-version",
        message:
          "file format version 99.0 is newer than this app (1.0); update the app to open this file",
        location: { kind: "whole-document" },
      },
    ],
  } satisfies DocumentErrorListProps,
};

/** 書き込み中は書き戻しを押し直せない（rules/hooks.md「連打防止は disabled」）。 */
export const Reverting: Story = {
  name: "書き戻しの最中",
  args: {
    origin: DocumentErrorOrigins.OpenedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: true,
    errors: [
      {
        kind: "dangling-ref",
        message: 'unknown component "missing-button"',
        location: { kind: "node", nodeName: "home-login" },
      },
    ],
  } satisfies DocumentErrorListProps,
};

/**
 * まだ何も開けていない画面（開始画面）。飛び先のノードも書き戻す表示中の内容も
 * 無いので、`Reveal` も `revert file` も出ない（#136）。
 */
export const UnopenedFile: Story = {
  name: "開けなかったファイル",
  args: {
    origin: DocumentErrorOrigins.UnopenedFile,
    errors: [
      {
        kind: "dangling-ref",
        message: 'unknown component "missing-button"',
        location: { kind: "node", nodeName: "home-login" },
      },
    ],
  } satisfies DocumentErrorListProps,
};

export const NoErrors: Story = {
  name: "エラーがない",
  args: {
    origin: DocumentErrorOrigins.UnopenedFile,
    errors: [],
  } satisfies DocumentErrorListProps,
};

/**
 * アプリ内の編集で作った不正（#128）。ファイル由来と見出し・読み上げ名が分かれ、
 * 下端へ密着せず、挿入のツールバーと積み重なる形で出る。
 */
export const DocumentOrigin: Story = {
  name: "編集で作った不正",
  args: {
    origin: DocumentErrorOrigins.Document,
    onReveal: fn(),
    errors: [
      {
        kind: "dangling-token",
        message:
          'prop "typography" references unknown typography token "heading"',
        location: { kind: "node", nodeName: "home-title", prop: "typography" },
      },
    ],
  } satisfies DocumentErrorListProps,
};
