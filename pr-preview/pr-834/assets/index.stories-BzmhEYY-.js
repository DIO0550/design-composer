import{n as e}from"./chunk-BneVvdWh.js";import{r as t,t as n}from"./document-access-failure-Bdw4Exhi.js";import{i as r,t as i}from"./document-open-failure-DYNA0jU0.js";var a,o,s,c,l;e((()=>{t(),r(),a={title:`features/editor/features/document-start/DocumentOpenFailureBanner`,component:i,parameters:{layout:`fullscreen`},args:{failure:{kind:`io`,error:n.create(`missing`,`/work/settings-ui/app.dcmp`)}}},o={name:`ファイルが見つからない`},s={name:`ファイルを選べなかった`,args:{failure:{kind:`dialog`,error:{message:`dialog.open not allowed`}}}},c={name:`ドキュメントとして読み取れない`,args:{failure:{kind:`unparsable`,errors:[{kind:`syntax-error`,message:`unexpected end of JSON input`,location:{kind:`text-position`,position:19}}]}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "ファイルが見つからない"
}`,...o.parameters?.docs?.source},description:{story:`ファイルへ届かなかった状態。理由の 1 行と診断用の原文が並ぶ。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "ファイルを選べなかった",
  args: {
    failure: {
      kind: "dialog",
      error: {
        message: "dialog.open not allowed"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`ダイアログを出せなかった状態。原文は OS 側の綴りがそのまま出る。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "ドキュメントとして読み取れない",
  args: {
    failure: {
      kind: "unparsable",
      errors: [{
        kind: "syntax-error",
        message: "unexpected end of JSON input",
        location: {
          kind: "text-position",
          position: 19
        }
      }]
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`解釈できなかった状態。**帯には理由の 1 行しか出さない**（件数分だけ伸びるエラー一覧を
3 ペインの上へ積むと、開いているドキュメントの表示領域を押し潰すため）。原文も持たない。`,...c.parameters?.docs?.description}}},l=[`Unreachable`,`DialogFailed`,`Unparsable`]}))();export{s as DialogFailed,c as Unparsable,o as Unreachable,l as __namedExportsOrder,a as default};