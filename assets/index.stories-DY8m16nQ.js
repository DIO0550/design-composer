import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./pane-body-DA_USLG7.js";import{n as i,t as a}from"./pane-heading-CMKY7S1-.js";import{n as o,r as s,t as c}from"./design-document-BhLnEpv5.js";import{n as l,t as u}from"./document-selection-DYlf2-eJ.js";import{t as d}from"./shorthand-row-PxWUzQLu.js";import{n as f,t as p}from"./property-panel-DYLbc9cj.js";function m(e){return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(a,{children:(0,h.jsx)(p.Title,{selection:e.selection})}),(0,h.jsx)(r,{children:(0,h.jsx)(p.Body,{...e})})]})}var h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L;e((()=>{n(),i(),o(),l(),f(),h=t(),{expect:g,fn:_,screen:v,userEvent:y}=__STORYBOOK_MODULE_TEST__,b=`very-long-node-name-that-does-not-fit-in-the-heading`,x=c.create({tokens:s.Default.tokens,components:s.Default.components,artboards:[{name:`home`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`home-title`,type:`Text`,props:{content:`ホーム`,typography:`heading`}},{name:`home-login`,ref:`primary-button`,overrides:{label:`ログイン`}}]},{name:`overflow`,width:240,height:160,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`},children:[{name:`overflow-wide`,type:`Box`,props:{widthMode:`fixed`,width:480,heightMode:`fixed`,height:320,background:`primary`,radius:`md`},children:[]}]}]}),S=c.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]}),C=c.create({tokens:s.Default.tokens,artboards:[{name:`home`,width:360,height:240,children:[{name:`uniform-padding-box`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`}},{name:`mixed-padding-box`,type:`Box`,props:{paddingTop:`sm`,paddingRight:`lg`,paddingBottom:`md`,paddingLeft:`lg`}}]}]}),w=c.create({artboards:[{name:`home`,width:360,height:240,children:[{name:b,type:`Box`}]}]}),T={title:`features/inspector/PropertyPanel`,component:m,parameters:{layout:`padded`},decorators:[e=>(0,h.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,h.jsx)(e,{})})],args:{isFrozen:!1,onClearSelection:_(),onEditProp:_(),instance:{goToSource:_(),selectAllInstances:_(),detach:_()}}},E={name:`選択されていない`,args:{selection:u.fromNames(x,[])}},D={name:`artboard を選択中`,args:{selection:u.fromNames(x,[`home`])}},O={name:`Text ノードを選択中`,args:{selection:u.fromNames(x,[`home-title`])}},k={name:`インスタンスを選択中（publicProps から生成）`,args:{selection:u.fromNames(x,[`home-login`])}},A={name:`Box ノードを選択中`,args:{selection:u.fromNames(x,[`overflow-wide`])}},j={name:`未指定の prop だけの Box を選択中`,args:{selection:u.fromNames(S,[`unset-box`])}},M={name:`名前が長いノードを選択中`,args:{selection:u.fromNames(w,[b])}},N={name:`凍結中`,args:{selection:u.fromNames(x,[`home`]),isFrozen:!0}},P={name:`padding が揃っている Box を選択中`,args:{selection:u.fromNames(C,[`uniform-padding-box`])}},F={name:`padding が不揃いな Box を選択中`,args:{selection:u.fromNames(C,[`mixed-padding-box`])}},I={name:`padding を辺ごとに出した Box を選択中`,args:{selection:u.fromNames(C,[`mixed-padding-box`])},play:async()=>{await y.click(v.getByRole(`button`,{name:d.perEdge})),await g(v.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, [])
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"])
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-title"])
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-login"])
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["overflow-wide"])
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(UnsetDocument, ["unset-box"])
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(LongNameDocument, [LongNodeName])
  }
}`,...M.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"]),
    isFrozen: true
  }
}`,...N.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。`,...N.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "padding が揃っている Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["uniform-padding-box"])
  }
}`,...P.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "padding が不揃いな Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["mixed-padding-box"])
  }
}`,...F.parameters?.docs?.source},description:{story:"4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。",...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source},description:{story:"4 辺を個別に出したとき。切り替えは `useState` なので、押した後の\n半幅セル 2×2 は `play` を通さないと視覚差分に載らない。",...I.parameters?.docs?.description}}},L=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`,`Frozen`,`PaddingUniform`,`PaddingMixed`,`PaddingPerEdge`]}))();export{A as BoxSelected,E as Default,N as Frozen,k as InstanceSelected,M as LongName,F as PaddingMixed,I as PaddingPerEdge,P as PaddingUniform,D as Selected,O as TextSelected,j as Unset,L as __namedExportsOrder,T as default};