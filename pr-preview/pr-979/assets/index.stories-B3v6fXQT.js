import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BfXl6WpD.js";import{t as r}from"./jsx-runtime-D16BNjX-.js";import{n as i,t as a}from"./design-document-BKmVBUgb.js";import{n as o,t as s}from"./document-selection-BFZs7Q-Y.js";import{n as c,t as l}from"./token-selection-Cvd1KYlr.js";import{n as u,t as d}from"./use-node-drag-CPPRN_kh.js";import{i as f,n as p,r as m,t as h}from"./use-canvas-view-C-BJPZJC.js";import{i as g,n as _,r as v,t as y}from"./sample-canvas-document-B5E3cN5P.js";function b(e){let t=p(),n=u({selection:e.selection,view:t.view,onMove:()=>{},onInsertAt:()=>{},onReposition:()=>{}});return(0,x.jsx)(m,{...e,canvasView:t,nodeDrag:n})}var x,S,C,w,T,E,D,O,k,A,j,M,N;e((()=>{i(),o(),c(),v(),h(),d(),t(),f(),x=r(),{fn:S}=__STORYBOOK_MODULE_TEST__,C={title:`features/editor/features/canvas/ArtboardCanvas`,component:b,parameters:{layout:`fullscreen`},decorators:[e=>(0,x.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,x.jsx)(e,{})})],args:{tokenSelection:l.create(_,n.none),isFrozen:!1,onSelect:S(),onSelectInRange:S(),onResize:S(),onEditProp:S(),onRepositionArtboard:S(),onOpenContextMenu:S()}},w={name:`選択なし`,args:{selection:g()}},T={name:`artboard を選択中`,args:{selection:g([`settings`])}},E={name:`トークンを選択中`,args:{selection:g(),tokenSelection:l.create(_,n.some({kind:`colors`,name:`primary`}))}},D=a.create({tokens:_.tokens,components:_.components,artboards:_.artboards.map(e=>e.name===`settings`?{...e,props:{...e.props,visibility:`hidden`}}:e)}),O={name:`非表示の artboard を選択中`,args:{selection:s.fromNames(D,[`settings`]),tokenSelection:l.create(D,n.none)}},k=a.create({tokens:_.tokens,artboards:[{name:`shapes`,width:320,height:200,props:{layout:`row`,gap:`md`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`dot`,type:`Ellipse`},{name:`oval`,type:`Ellipse`,props:{width:140,height:72,background:`brand`}}]}]}),A={name:`Ellipse を選択中`,args:{selection:s.fromNames(k,[`oval`]),tokenSelection:l.create(k,n.none)}},j={name:`artboard がない`,args:{selection:s.fromNames(y,[]),tokenSelection:l.create(y,n.none)}},M={name:`ファイルが不正（凍結中）`,args:{selection:g([`home`]),isFrozen:!0}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleCanvasSelection()
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: sampleCanvasSelection(["settings"])
  }
}`,...T.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "トークンを選択中",
  args: {
    selection: sampleCanvasSelection(),
    tokenSelection: TokenSelection.create(SampleCanvasDocument, Option.some({
      kind: "colors",
      name: "primary"
    }))
  }
}`,...E.parameters?.docs?.source},description:{story:`選択中のトークンを参照しているノードに破線が出る。

**破線として描かれることと \`outline-offset\` はテストでは見えない**
（happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。`,...E.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "非表示の artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(HiddenSettingsDocument, ["settings"]),
    tokenSelection: TokenSelection.create(HiddenSettingsDocument, Option.none)
  }
}`,...O.parameters?.docs?.source},description:{story:`非表示の artboard は、選んでいても枠・見出し・リサイズハンドルごと描かれない
（docs/06-ui.md「非表示の artboard」）。後ろの自動配置の artboard は隠す前と同じ位置に残る
（\`選択なし\` と見比べる）。`,...O.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "Ellipse を選択中",
  args: {
    selection: DocumentSelection.fromNames(EllipseDocument, ["oval"]),
    tokenSelection: TokenSelection.create(EllipseDocument, Option.none)
  }
}`,...A.parameters?.docs?.source},description:{story:`Ellipse は \`border-radius: 50%\` で丸く描かれる（docs/03-schema.md「Ellipse 自体」）。
テストが守るのは宣言を出すところまでで、**それが実際に円として描かれることは見えない**
（happy-dom は CSS を描かない）。確かめる手段はこのストーリーの視覚差分だけ。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    tokenSelection: TokenSelection.create(EmptyCanvasDocument, Option.none)
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正（凍結中）",
  args: {
    selection: sampleCanvasSelection(["home"]),
    isFrozen: true
  }
}`,...M.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき。最後に描けた内容が斜線のスクリムの下に残り、右上に「最
後に正常だった表示」のバッジが出る。

選んだままの artboard に選択の枠は残るが、リサイズハンドルは出ない。**この差はこのストー
リーにしか映らない**（凍結していない \`artboard を選択中\` と見比べる）。`,...M.parameters?.docs?.description}}},N=[`Default`,`Selected`,`TokenSelected`,`HiddenArtboardSelected`,`EllipseSelected`,`Empty`,`Frozen`]}))();export{w as Default,A as EllipseSelected,j as Empty,M as Frozen,O as HiddenArtboardSelected,T as Selected,E as TokenSelected,N as __namedExportsOrder,C as default};