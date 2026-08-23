import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-BrPI_DhY.js";import{t as i}from"./jsx-runtime-4HHWW5MW.js";import{n as a,t as o}from"./document-selection-CfaX7LLt.js";import{n as s,r as c,t as l}from"./property-panel-C8Ji7ZuD.js";function u(e){return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(`div`,{className:`flex h-11 shrink-0 items-center gap-2 border-gray-300 border-b px-3`,children:(0,d.jsx)(l.Title,{selection:e.selection})}),(0,d.jsx)(`div`,{className:`min-h-0 flex-1 overflow-auto p-3`,children:(0,d.jsx)(l.Body,{...e})})]})}var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N;e((()=>{t(),a(),c(),d=i(),{expect:f,fn:p,screen:m,userEvent:h}=__STORYBOOK_MODULE_TEST__,g=`very-long-node-name-that-does-not-fit-in-the-heading`,_=r.create({tokens:n.Default.tokens,components:n.Default.components,artboards:[{name:`home`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`home-title`,type:`Text`,props:{content:`ホーム`,typography:`heading`}},{name:`home-login`,ref:`primary-button`,overrides:{label:`ログイン`}}]},{name:`overflow`,width:240,height:160,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`},children:[{name:`overflow-wide`,type:`Box`,props:{widthMode:`fixed`,width:480,heightMode:`fixed`,height:320,background:`primary`,radius:`md`},children:[]}]}]}),v=r.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]}),y=r.create({tokens:n.Default.tokens,artboards:[{name:`home`,width:360,height:240,children:[{name:`uniform-padding-box`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`}},{name:`mixed-padding-box`,type:`Box`,props:{paddingTop:`sm`,paddingRight:`lg`,paddingBottom:`md`,paddingLeft:`lg`}}]}]}),b=r.create({artboards:[{name:`home`,width:360,height:240,children:[{name:g,type:`Box`}]}]}),x={title:`features/inspector/PropertyPanel`,component:u,parameters:{layout:`padded`},decorators:[e=>(0,d.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,d.jsx)(e,{})})],args:{isFrozen:!1,onClearSelection:p(),onEditProp:p(),instance:{goToSource:p(),selectAllInstances:p(),detach:p()}}},S={name:`選択されていない`,args:{selection:o.fromNames(_,[])}},C={name:`artboard を選択中`,args:{selection:o.fromNames(_,[`home`])}},w={name:`Text ノードを選択中`,args:{selection:o.fromNames(_,[`home-title`])}},T={name:`インスタンスを選択中（publicProps から生成）`,args:{selection:o.fromNames(_,[`home-login`])}},E={name:`Box ノードを選択中`,args:{selection:o.fromNames(_,[`overflow-wide`])}},D={name:`未指定の prop だけの Box を選択中`,args:{selection:o.fromNames(v,[`unset-box`])}},O={name:`名前が長いノードを選択中`,args:{selection:o.fromNames(b,[g])}},k={name:`凍結中`,args:{selection:o.fromNames(_,[`home`]),isFrozen:!0}},A={name:`padding が揃っている Box を選択中`,args:{selection:o.fromNames(y,[`uniform-padding-box`])}},j={name:`padding が不揃いな Box を選択中`,args:{selection:o.fromNames(y,[`mixed-padding-box`])}},M={name:`padding を辺ごとに出した Box を選択中`,args:{selection:o.fromNames(y,[`mixed-padding-box`])},play:async()=>{await h.click(m.getByRole(`button`,{name:s.perEdge})),await f(m.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, [])
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"])
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-title"])
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-login"])
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["overflow-wide"])
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(UnsetDocument, ["unset-box"])
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(LongNameDocument, [LongNodeName])
  }
}`,...O.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"]),
    isFrozen: true
  }
}`,...k.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。`,...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "padding が揃っている Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["uniform-padding-box"])
  }
}`,...A.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "padding が不揃いな Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, ["mixed-padding-box"])
  }
}`,...j.parameters?.docs?.source},description:{story:"4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。",...j.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source},description:{story:"4 辺を個別に出したとき。切り替えは `useState` なので、押した後の\n半幅セル 2×2 は `play` を通さないと視覚差分に載らない。",...M.parameters?.docs?.description}}},N=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`,`Frozen`,`PaddingUniform`,`PaddingMixed`,`PaddingPerEdge`]}))();export{E as BoxSelected,S as Default,k as Frozen,T as InstanceSelected,O as LongName,j as PaddingMixed,M as PaddingPerEdge,A as PaddingUniform,C as Selected,w as TextSelected,D as Unset,N as __namedExportsOrder,x as default};