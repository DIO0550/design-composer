import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-B-7AsI0c.js";import{a as i,n as a,r as o}from"./sample-editor-state-BD_hYwet.js";import{n as s,t as c}from"./editor-state-Ck6bh1Ay.js";import{t as l}from"./jsx-runtime-ChEsXk_u.js";import{n as u,r as d,t as f}from"./property-panel-ByUadIej.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P;e((()=>{t(),i(),s(),d(),p=l(),{expect:m,fn:h,screen:g,userEvent:_}=__STORYBOOK_MODULE_TEST__,v=`very-long-node-name-that-does-not-fit-in-the-heading`,y=c.create(r.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]})),b=c.create(r.create({tokens:n.Default.tokens,artboards:[{name:`home`,width:360,height:240,children:[{name:`uniform-padding-box`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`}},{name:`mixed-padding-box`,type:`Box`,props:{paddingTop:`sm`,paddingRight:`lg`,paddingBottom:`md`,paddingLeft:`lg`}}]}]})),x=c.create(r.create({artboards:[{name:`home`,width:360,height:240,children:[{name:v,type:`Box`}]}]})),S={title:`features/editor/PropertyPanel`,component:f,parameters:{layout:`padded`},decorators:[e=>(0,p.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,p.jsx)(e,{})})],args:{onClearSelection:h(),onEditProp:h(),instance:{goToSource:h(),selectAllInstances:h(),detach:h()}}},C={name:`選択されていない`,args:{state:o}},w={name:`artboard を選択中`,args:{state:c.select(o,`home`)}},T={name:`Text ノードを選択中`,args:{state:c.select(o,`home-title`)}},E={name:`インスタンスを選択中（publicProps から生成）`,args:{state:c.select(o,`home-login`)}},D={name:`Box ノードを選択中`,args:{state:c.select(o,`overflow-wide`)}},O={name:`未指定の prop だけの Box を選択中`,args:{state:c.select(y,`unset-box`)}},k={name:`名前が長いノードを選択中`,args:{state:c.select(x,v)}},A={name:`凍結中`,args:{state:a}},j={name:`padding が揃っている Box を選択中`,args:{state:c.select(b,`uniform-padding-box`)}},M={name:`padding が不揃いな Box を選択中`,args:{state:c.select(b,`mixed-padding-box`)}},N={name:`padding を辺ごとに出した Box を選択中`,args:{state:c.select(b,`mixed-padding-box`)},play:async()=>{await _.click(g.getByRole(`button`,{name:u.perEdge})),await m(g.getByRole(`combobox`,{name:`Padding Top`})).toBeDefined()}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SampleEditorState
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SampleEditorState, "home")
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    state: EditorState.select(SampleEditorState, "home-title")
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    state: EditorState.select(SampleEditorState, "home-login")
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    state: EditorState.select(SampleEditorState, "overflow-wide")
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    state: EditorState.select(UnsetEditorState, "unset-box")
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LongNameEditorState, LongNodeName)
  }
}`,...k.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    state: FileInvalidEditorState
  }
}`,...A.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "padding が揃っている Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "uniform-padding-box")
  }
}`,...j.parameters?.docs?.source},description:{story:`4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。`,...j.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "padding が不揃いな Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "mixed-padding-box")
  }
}`,...M.parameters?.docs?.source},description:{story:"4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。",...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "padding を辺ごとに出した Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "mixed-padding-box")
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: ShorthandLabels.perEdge
    }));
    await expect(screen.getByRole("combobox", {
      name: "Padding Top"
    })).toBeDefined();
  }
}`,...N.parameters?.docs?.source},description:{story:"4 辺を個別に出したとき。切り替えは `useState` なので、押した後の\n半幅セル 2×2 は `play` を通さないと視覚差分に載らない。",...N.parameters?.docs?.description}}},P=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`,`Frozen`,`PaddingUniform`,`PaddingMixed`,`PaddingPerEdge`]}))();export{D as BoxSelected,C as Default,A as Frozen,E as InstanceSelected,k as LongName,M as PaddingMixed,N as PaddingPerEdge,j as PaddingUniform,w as Selected,T as TextSelected,O as Unset,P as __namedExportsOrder,S as default};