import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,r,t as i}from"./document-error-list-DOWqorVi.js";var a,o,s,c,l,u,d;e((()=>{r(),a=t(),o={title:`features/editor/DocumentErrorList`,component:n,parameters:{layout:`fullscreen`},decorators:[e=>(0,a.jsxs)(`div`,{className:`relative h-96 w-full bg-gray-100 p-4 text-gray-500 text-sm`,children:[`最後に正常だったレンダリング`,(0,a.jsx)(e,{})]})]},s={name:`JSON が壊れている`,args:{origin:i.file,errors:[{kind:`syntax-error`,message:`expected ',' or '}'`,location:{kind:`text-position`,position:142}}]}},c={name:`スキーマ違反が複数`,args:{origin:i.file,errors:[{kind:`unknown-prop`,message:`unknown prop "colour"`,location:{kind:`node`,nodeName:`home-title`,prop:`colour`}},{kind:`dangling-ref`,message:`unknown component "missing-button"`,location:{kind:`node`,nodeName:`home-login`}},{kind:`invalid-type`,message:`expected number but got string`,location:{kind:`document-path`,path:`artboards[0].width`}},{kind:`unsupported-format-version`,message:`file format version 99.0 is newer than this app (1.0); update the app to open this file`,location:{kind:`whole-document`}}]}},l={name:`エラーがない`,args:{origin:i.file,errors:[]}},u={name:`編集で作った不正`,args:{origin:i.document,errors:[{kind:`dangling-token`,message:`prop "typography" references unknown typography token "heading"`,location:{kind:`node`,nodeName:`home-title`,prop:`typography`}}]}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "JSON が壊れている",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.file,
    errors: [{
      kind: "syntax-error",
      message: "expected ',' or '}'",
      location: {
        kind: "text-position",
        position: 142
      }
    }]
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "スキーマ違反が複数",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.file,
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
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "エラーがない",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.file,
    errors: []
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "編集で作った不正",
  args: {
    origin: DOCUMENT_ERROR_ORIGINS.document,
    errors: [{
      kind: "dangling-token",
      message: 'prop "typography" references unknown typography token "heading"',
      location: {
        kind: "node",
        nodeName: "home-title",
        prop: "typography"
      }
    }]
  }
}`,...u.parameters?.docs?.source},description:{story:`アプリ内の編集で作った不正（#128）。ファイル由来と見出し・読み上げ名が分かれ、
下端へ密着せず、挿入のツールバーと積み重なる形で出る。`,...u.parameters?.docs?.description}}},d=[`BrokenJson`,`SchemaErrors`,`NoErrors`,`DocumentOrigin`]}))();export{s as BrokenJson,u as DocumentOrigin,l as NoErrors,c as SchemaErrors,d as __namedExportsOrder,o as default};