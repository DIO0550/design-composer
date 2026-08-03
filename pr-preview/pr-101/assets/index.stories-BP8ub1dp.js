import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,t as r}from"./document-error-list-JU5WxUWL.js";var i,a,o,s,c,l;e((()=>{n(),i=t(),a={title:`features/editor/DocumentErrorList`,component:r,parameters:{layout:`fullscreen`},decorators:[e=>(0,i.jsxs)(`div`,{className:`relative h-96 w-full bg-gray-100 p-4 text-gray-500 text-sm`,children:[`最後に正常だったレンダリング`,(0,i.jsx)(e,{})]})]},o={name:`JSON が壊れている`,args:{errors:[{kind:`syntax-error`,message:`expected ',' or '}'`,location:{kind:`text-position`,position:142}}]}},s={name:`スキーマ違反が複数`,args:{errors:[{kind:`unknown-prop`,message:`unknown prop "colour"`,location:{kind:`node`,nodeName:`home-title`,prop:`colour`}},{kind:`dangling-ref`,message:`unknown component "missing-button"`,location:{kind:`node`,nodeName:`home-login`}},{kind:`invalid-type`,message:`expected number but got string`,location:{kind:`document-path`,path:`artboards[0].width`}},{kind:`unsupported-format-version`,message:`file format version 99.0 is newer than this app (1.0); update the app to open this file`,location:{kind:`whole-document`}}]}},c={name:`エラーがない`,args:{errors:[]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "JSON が壊れている",
  args: {
    errors: [{
      kind: "syntax-error",
      message: "expected ',' or '}'",
      location: {
        kind: "text-position",
        position: 142
      }
    }]
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "スキーマ違反が複数",
  args: {
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
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "エラーがない",
  args: {
    errors: []
  }
}`,...c.parameters?.docs?.source}}},l=[`BrokenJson`,`SchemaErrors`,`NoErrors`]}))();export{o as BrokenJson,c as NoErrors,s as SchemaErrors,l as __namedExportsOrder,a as default};