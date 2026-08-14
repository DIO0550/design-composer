import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i,t as a}from"./sample-editor-state-CSdBGFVP.js";import{a as o,n as s,o as c,t as l}from"./artboard-canvas-CJorUegB.js";import{t as u}from"./jsx-runtime-Cw9gq7QB.js";function d(e){let t=c();return(0,f.jsx)(l,{...e,canvasView:t})}var f,p,m,h,g,_,v,y;e((()=>{i(),t(),o(),s(),f=u(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/editor/ArtboardCanvas`,component:d,parameters:{layout:`fullscreen`},decorators:[e=>(0,f.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,f.jsx)(e,{})})],args:{onSelect:p(),onMoveNode:p(),onResize:p(),onEditProp:p()}},h={name:`選択なし`,args:{state:r}},g={name:`artboard を選択中`,args:{state:n.select(r,`settings`)}},_={name:`トークンを選択中`,args:{state:n.selectToken(r,{kind:`colors`,name:`primary`})}},v={name:`artboard がない`,args:{state:a}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...g.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary"
    })
  }
}`,..._.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る（#147）。

\`primary\` を選ぶのは、キャンバス上でこれを指しているのが \`overflow-wide\` の 1 件だけで、
破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Selected`,`TokenSelected`,`Empty`]}))();export{h as Default,v as Empty,g as Selected,_ as TokenSelected,y as __namedExportsOrder,m as default};