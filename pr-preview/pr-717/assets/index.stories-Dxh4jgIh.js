import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{n,t as r}from"./left-pane-shell-Bg7Fse5V.js";import{n as i,t as a}from"./token-list-BCY2nwOA.js";import{n as o,r as s,t as c}from"./sample-token-document-DbZDe_T6.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{n(),o(),i(),l=t(),{expect:u,fn:d,screen:f,userEvent:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/editor/features/tokens/TokenList`,component:a,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(r,{children:(0,l.jsx)(e,{})})],args:{onSelectToken:d(),onAddToken:d()}},h={name:`colors だけが開いている`,args:{selection:c}},g={name:`色トークンを選択中`,args:{selection:s({kind:`colors`,name:`primary`})}},_={name:`gradients を開いている`,args:{selection:c},play:async()=>{await p.click(f.getByRole(`button`,{name:/gradients/,expanded:!1})),await u(f.getByRole(`button`,{name:/brand/})).toBeDefined()}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "colors だけが開いている",
  args: {
    selection: NoTokenSelection
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "gradients を開いている",
  args: {
    selection: NoTokenSelection
  },
  play: async () => {
    await userEvent.click(screen.getByRole("button", {
      name: /gradients/,
      expanded: false
    }));
    await expect(screen.getByRole("button", {
      name: /brand/
    })).toBeDefined();
  }
}`,..._.parameters?.docs?.source},description:{story:"開いた直後は colors しか開かないので、グラデーションの見本と、値が名前を押し出さない\nことは `play` を通さないと視覚差分に載らない。",..._.parameters?.docs?.description}}},v=[`Default`,`ColorSelected`,`GradientsOpen`]}))();export{g as ColorSelected,h as Default,_ as GradientsOpen,v as __namedExportsOrder,m as default};