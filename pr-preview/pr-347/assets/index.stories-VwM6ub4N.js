import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./right-pane-shell-BPcpmR5m.js";import{n as i,t as a}from"./pane-body-BnHUDQ4l.js";import{n as o,t as s}from"./pane-heading-CQ-2jmhx.js";import{n as c,r as l,t as u}from"./design-document-YjaXahWS.js";import{n as d,t as f}from"./document-selection-Dmj_aId3.js";import{t as p}from"./shorthand-row-P030DnNq.js";import{n as m,t as h}from"./property-panel-CHbpi8Q-.js";function g(e){return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(s,{children:(0,_.jsx)(h.Title,{selection:e.selection})}),(0,_.jsx)(a,{children:(0,_.jsx)(h.Body,{...e})})]})}var _,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z;e((()=>{n(),i(),o(),c(),d(),m(),_=t(),{expect:v,fn:y,screen:b,userEvent:x}=__STORYBOOK_MODULE_TEST__,S=`very-long-node-name-that-does-not-fit-in-the-heading`,C=u.create({tokens:l.Default.tokens,components:l.Default.components,artboards:[{name:`home`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`home-title`,type:`Text`,props:{content:`ホーム`,typography:`heading`}},{name:`home-login`,ref:`primary-button`,overrides:{label:`ログイン`}}]},{name:`overflow`,width:240,height:160,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`},children:[{name:`overflow-wide`,type:`Box`,props:{widthMode:`fixed`,width:480,heightMode:`fixed`,height:320,background:`primary`,radius:`md`},children:[]}]}]}),w=u.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]}),T=u.create({tokens:l.Default.tokens,artboards:[{name:`home`,width:360,height:240,children:[{name:`uniform-padding-box`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`}},{name:`mixed-padding-box`,type:`Box`,props:{paddingTop:`sm`,paddingRight:`lg`,paddingBottom:`md`,paddingLeft:`lg`}}]}]}),E=u.create({artboards:[{name:`home`,width:360,height:240,children:[{name:S,type:`Box`}]}]}),D={title:`features/inspector/PropertyPanel`,component:g,parameters:{layout:`padded`},decorators:[e=>(0,_.jsx)(r,{height:`pane`,children:(0,_.jsx)(e,{})})],args:{isFrozen:!1,onClearSelection:y(),onEditProp:y(),instance:{goToSource:y(),selectAllInstances:y(),detach:y()}}},O={name:`選択されていない`,args:{selection:f.fromNames(C,[])}},k={name:`artboard を選択中`,args:{selection:f.fromNames(C,[`home`])}},A={name:`Text ノードを選択中`,args:{selection:f.fromNames(C,[`home-title`])}},j={name:`インスタンスを選択中（publicProps から生成）`,args:{selection:f.fromNames(C,[`home-login`])}},M={name:`Box ノードを選択中`,args:{selection:f.fromNames(C,[`overflow-wide`])}},N={name:`未指定の prop だけの Box を選択中`,args:{selection:f.fromNames(w,[`unset-box`])}},P={name:`名前が長いノードを選択中`,args:{selection:f.fromNames(E,[S])}},F={name:`凍結中`,args:{selection:f.fromNames(C,[`home`]),isFrozen:!0}},I={name:`padding が揃っている Box を選択中`,args:{selection:f.fromNames(T,[`uniform-padding-box`])}},L={name:`padding が不揃いな Box を選択中`,args:{selection:f.fromNames(T,[`mixed-padding-box`])}},R={name:`padding を辺ごとに出した Box を選択中`,args:{selection:f.fromNames(T,[`mixed-padding-box`])},play:async()=>{await x.click(b.getByRole(`button`,{name:p.perEdge})),await v(b.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, [])
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"])
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-title"])
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-login"])
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["overflow-wide"])
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(UnsetDocument, ["unset-box"])
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(LongNameDocument, [LongNodeName])
  }
}`,...P.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"]),
    isFrozen: true
  }
}`,...F.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。`,...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "padding が揃っている Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["uniform-padding-box"])
  }
}`,...I.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "padding が不揃いな Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["mixed-padding-box"])
  }
}`,...L.parameters?.docs?.source},description:{story:"4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。",...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "padding を辺ごとに出した Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["mixed-padding-box"])
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: ShorthandLabels.perEdge
    }));
    await expect(screen.getByRole("combobox", {
      name: "Padding Top"
    })).toBeDefined();
  }
}`,...R.parameters?.docs?.source},description:{story:"4 辺を個別に出したとき。切り替えは `useState` なので、押した後の\n半幅セル 2×2 は `play` を通さないと視覚差分に載らない。",...R.parameters?.docs?.description}}},z=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`,`Frozen`,`PaddingUniform`,`PaddingMixed`,`PaddingPerEdge`]}))();export{M as BoxSelected,O as Default,F as Frozen,j as InstanceSelected,P as LongName,L as PaddingMixed,R as PaddingPerEdge,I as PaddingUniform,k as Selected,A as TextSelected,N as Unset,z as __namedExportsOrder,D as default};