import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./Option-PwGEWw_t.js";import{n as i,t as a}from"./right-pane-shell-CFHk1cDC.js";import{n as o,t as s}from"./pane-body-DjssXhvl.js";import{n as c,t as l}from"./pane-heading-B1oVNX7r.js";import{j as u,k as d}from"./size-DgKf1xUW.js";import{n as f,t as p}from"./design-document-B5YsFw1Q.js";import{n as m,t as h}from"./token-selection-Cnu4cjzH.js";import{n as g,t as _}from"./token-editor-Dh1HL9Xk.js";import{n as v,r as y,t as b}from"./sample-token-document-DvHr9_J6.js";function x(e){return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(l,{children:(0,S.jsx)(_.Title,{selection:e.selection})}),(0,S.jsx)(s,{children:(0,S.jsx)(_.Body,{...e})})]})}var S,C,w,T,E,D,O,k,A,j,M,N,P;e((()=>{i(),o(),c(),f(),u(),m(),v(),n(),g(),S=t(),{fn:C}=__STORYBOOK_MODULE_TEST__,w={title:`features/editor/features/tokens/TokenEditor`,component:x,parameters:{layout:`padded`},decorators:[e=>(0,S.jsx)(a,{height:`pane`,children:(0,S.jsx)(e,{})})],args:{onSetTokenValue:C(),onRenameToken:C(),onRemoveToken:C()}},T={name:`選択されていない`,args:{selection:b}},E={name:`色トークンを選択中`,args:{selection:y({kind:`colors`,name:`primary`})}},D={name:`間隔トークンを選択中`,args:{selection:y({kind:`spacing`,name:`md`})}},O={name:`影トークンを選択中`,args:{selection:y({kind:`shadows`,name:`md`})}},k={name:`書体トークンを選択中`,args:{selection:y({kind:`typography`,name:`body`})}},A={name:`角丸トークンを選択中`,args:{selection:y({kind:`radius`,name:`md`})}},j={name:`グラデーショントークンを選択中`,args:{selection:y({kind:`gradients`,name:`brand`})}},M={name:`hex として読めない色トークンを選択中`,args:{selection:h.create(p.create({tokens:{...d.empty(),colors:{broken:`RED`}}}),r.some({kind:`colors`,name:`broken`}))}},N={name:`1 件目の stop の色が hex として読めないグラデーションを選択中`,args:{selection:h.create(p.create({tokens:{...d.empty(),gradients:{brand:{shape:`linear`,angle:90,stops:[{color:`RED`,ratio:0},{color:`#1d4ed8`,ratio:1}]}}}}),r.some({kind:`gradients`,name:`brand`}))}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    selection: NoTokenSelection
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "colors",
      name: "primary"
    })
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "間隔トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "spacing",
      name: "md"
    })
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "影トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "shadows",
      name: "md"
    })
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "書体トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "typography",
      name: "body"
    })
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "角丸トークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "radius",
      name: "md"
    })
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "グラデーショントークンを選択中",
  args: {
    selection: sampleTokenSelection({
      kind: "gradients",
      name: "brand"
    })
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "hex として読めない色トークンを選択中",
  args: {
    selection: TokenSelection.create(DesignDocument.create({
      tokens: {
        ...TokenSet.empty(),
        colors: {
          broken: "RED"
        }
      }
    }), Option.some({
      kind: "colors",
      name: "broken"
    }))
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "1 件目の stop の色が hex として読めないグラデーションを選択中",
  args: {
    selection: TokenSelection.create(DesignDocument.create({
      tokens: {
        ...TokenSet.empty(),
        gradients: {
          brand: {
            shape: "linear",
            angle: 90,
            stops: [{
              color: "RED",
              ratio: 0
            }, {
              color: "#1d4ed8",
              ratio: 1
            }]
          }
        }
      }
    }), Option.some({
      kind: "gradients",
      name: "brand"
    }))
  }
}`,...N.parameters?.docs?.source}}},P=[`Default`,`ColorSelected`,`SpacingSelected`,`ShadowSelected`,`TypographySelected`,`RadiusSelected`,`GradientSelected`,`BrokenColorSelected`,`BrokenStopSelected`]}))();export{M as BrokenColorSelected,N as BrokenStopSelected,E as ColorSelected,T as Default,j as GradientSelected,A as RadiusSelected,O as ShadowSelected,D as SpacingSelected,k as TypographySelected,P as __namedExportsOrder,w as default};