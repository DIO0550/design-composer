import{n as e}from"./chunk-BneVvdWh.js";import{r as t,t as n}from"./document-access-failure-D1E_BYI3.js";import{i as r,t as i}from"./document-open-failure-Ci-u16aj.js";var a,o,s,c,l,u,d;e((()=>{t(),r(),a=`/work/settings-ui/app.dcmp`,o={title:`features/editor/features/document-start/DocumentOpenFailureBanner`,component:i,parameters:{layout:`fullscreen`},args:{failure:{kind:`io`,error:n.create(`missing`,a)}}},s={name:`ファイルが見つからない`},c={name:`ファイルを選べなかった`,args:{failure:{kind:`dialog`,error:{message:"/work/settings-ui/notes.txt: 拡張子が `.dcmp` ではない"}}}},l={name:`このアプリで選ばれていない`,args:{failure:{kind:`io`,error:n.create(`unchosen`,`${a}: このアプリで選ばれていない`)}}},u={name:`ドキュメントとして読み取れない`,args:{failure:{kind:`unparsable`,errors:[{kind:`syntax-error`,message:`unexpected end of JSON input`,location:{kind:`text-position`,position:19}}]}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "ファイルが見つからない"
}`,...s.parameters?.docs?.source},description:{story:`ファイルへ届かなかった状態。理由の 1 行と診断用の原文が並ぶ。`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "ファイルを選べなかった",
  args: {
    failure: {
      kind: "dialog",
      error: {
        message: "/work/settings-ui/notes.txt: 拡張子が \`.dcmp\` ではない"
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:"ファイルを選べなかった状態（`.dcmp` 以外を選んだなど）。原文は Rust が返した綴りが\nそのまま出る。",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "このアプリで選ばれていない",
  args: {
    failure: {
      kind: "io",
      error: DocumentAccessFailure.create("unchosen", \`\${MissingPath}: このアプリで選ばれていない\`)
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`このアプリで選ばれていないファイルを開こうとした状態を、ドキュメントを開いている間に
起きた場合の見え方で示す。選び直す先を理由の 1 行で示す。`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
}`,...u.parameters?.docs?.source},description:{story:`解釈できなかった状態。**帯には理由の 1 行しか出さない**（件数分だけ伸びるエラー一覧を
3 ペインの上へ積むと、開いているドキュメントの表示領域を押し潰すため）。原文も持たない。`,...u.parameters?.docs?.description}}},d=[`Unreachable`,`DialogFailed`,`Unchosen`,`Unparsable`]}))();export{c as DialogFailed,l as Unchosen,u as Unparsable,s as Unreachable,d as __namedExportsOrder,o as default};