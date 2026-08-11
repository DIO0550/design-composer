import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-Cw9gq7QB.js";import{n,r,t as i}from"./document-error-list-DKtrbfF_.js";var a,o,s,c,l,u,d,f,p,m;e((()=>{r(),a=t(),{fn:o}=__STORYBOOK_MODULE_TEST__,s={title:`features/editor/DocumentErrorList`,component:n,parameters:{layout:`fullscreen`},decorators:[e=>(0,a.jsxs)(`div`,{className:`relative h-96 w-full bg-gray-100 p-4 text-gray-500 text-sm`,children:[`最後に正常だったレンダリング`,(0,a.jsx)(e,{})]})]},c={name:`JSON が壊れている`,args:{origin:i.openedFile,onReveal:o(),onRevertFile:o(),isReverting:!1,errors:[{kind:`syntax-error`,message:`expected ',' or '}'`,location:{kind:`text-position`,position:142}}]}},l={name:`スキーマ違反が複数`,args:{origin:i.openedFile,onReveal:o(),onRevertFile:o(),isReverting:!1,errors:[{kind:`unknown-prop`,message:`unknown prop "colour"`,location:{kind:`node`,nodeName:`home-title`,prop:`colour`}},{kind:`dangling-ref`,message:`unknown component "missing-button"`,location:{kind:`node`,nodeName:`home-login`}},{kind:`invalid-type`,message:`expected number but got string`,location:{kind:`document-path`,path:`artboards[0].width`}},{kind:`unsupported-format-version`,message:`file format version 99.0 is newer than this app (1.0); update the app to open this file`,location:{kind:`whole-document`}}]}},u={name:`書き戻しの最中`,args:{origin:i.openedFile,onReveal:o(),onRevertFile:o(),isReverting:!0,errors:[{kind:`dangling-ref`,message:`unknown component "missing-button"`,location:{kind:`node`,nodeName:`home-login`}}]}},d={name:`開けなかったファイル`,args:{origin:i.unopenedFile,errors:[{kind:`dangling-ref`,message:`unknown component "missing-button"`,location:{kind:`node`,nodeName:`home-login`}}]}},f={name:`エラーがない`,args:{origin:i.unopenedFile,errors:[]}},p={name:`編集で作った不正`,args:{origin:i.document,onReveal:o(),errors:[{kind:`dangling-token`,message:`prop "typography" references unknown typography token "heading"`,location:{kind:`node`,nodeName:`home-title`,prop:`typography`}}]}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "JSON が壊れている",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.openedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: false,
    errors: [{
      kind: "syntax-error",
      message: "expected ',' or '}'",
      location: {
        kind: "text-position",
        position: 142
      }
    }]
  } satisfies DocumentErrorListProps
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "スキーマ違反が複数",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.openedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: false,
    errors: [{
      kind: "unknown-prop",
      message: 'unknown prop "colour"',
      location: {
        kind: "node",
        nodeName: "home-title",
        prop: "colour"
      }
    }, {
      kind: "dangling-ref",
      message: 'unknown component "missing-button"',
      location: {
        kind: "node",
        nodeName: "home-login"
      }
    }, {
      kind: "invalid-type",
      message: "expected number but got string",
      location: {
        kind: "document-path",
        path: "artboards[0].width"
      }
    }, {
      kind: "unsupported-format-version",
      message: "file format version 99.0 is newer than this app (1.0); update the app to open this file",
      location: {
        kind: "whole-document"
      }
    }]
  } satisfies DocumentErrorListProps
}`,...l.parameters?.docs?.source},description:{story:"場所の持ち方が 4 種類そろう。`Reveal` が出るのはノードを指す 2 件だけで、\n出し分けがそのまま見える（#136）。",...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "書き戻しの最中",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.openedFile,
    onReveal: fn(),
    onRevertFile: fn(),
    isReverting: true,
    errors: [{
      kind: "dangling-ref",
      message: 'unknown component "missing-button"',
      location: {
        kind: "node",
        nodeName: "home-login"
      }
    }]
  } satisfies DocumentErrorListProps
}`,...u.parameters?.docs?.source},description:{story:`書き込み中は書き戻しを押し直せない（rules/hooks.md「連打防止は disabled」）。`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "開けなかったファイル",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.unopenedFile,
    errors: [{
      kind: "dangling-ref",
      message: 'unknown component "missing-button"',
      location: {
        kind: "node",
        nodeName: "home-login"
      }
    }]
  } satisfies DocumentErrorListProps
}`,...d.parameters?.docs?.source},description:{story:"まだ何も開けていない画面（開始画面）。飛び先のノードも書き戻す表示中の内容も\n無いので、`Reveal` も `revert file` も出ない（#136）。",...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "エラーがない",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.unopenedFile,
    errors: []
  } satisfies DocumentErrorListProps
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "編集で作った不正",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.document,
    onReveal: fn(),
    errors: [{
      kind: "dangling-token",
      message: 'prop "typography" references unknown typography token "heading"',
      location: {
        kind: "node",
        nodeName: "home-title",
        prop: "typography"
      }
    }]
  } satisfies DocumentErrorListProps
}`,...p.parameters?.docs?.source},description:{story:`アプリ内の編集で作った不正（#128）。ファイル由来と見出し・読み上げ名が分かれ、
下端へ密着せず、挿入のツールバーと積み重なる形で出る。`,...p.parameters?.docs?.description}}},m=[`BrokenJson`,`SchemaErrors`,`Reverting`,`UnopenedFile`,`NoErrors`,`DocumentOrigin`]}))();export{c as BrokenJson,p as DocumentOrigin,f as NoErrors,u as Reverting,l as SchemaErrors,d as UnopenedFile,m as __namedExportsOrder,s as default};