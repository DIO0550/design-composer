import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{i as n,r,t as i}from"./prop-field-Dm504voR.js";import{a,c as o,d as s,h as c,i as l,m as u,r as d,s as f,t as p}from"./panel-controls-DW8bkQ85.js";import{n as m,t as h}from"./panel-frame-BBIlUOs8.js";var g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{c(),m(),n(),g=t(),{fn:_}=__STORYBOOK_MODULE_TEST__,v={title:`features/inspector/PropertyPanel/PropField`,component:i,parameters:{layout:`padded`,docs:{description:{component:`値域ごとの入力欄。

6 種類を並べるのは、どの種別がどの見た目になるかがスキーマの走査だけで決まり、
画面から確かめる手段が視覚差分しか無いため（happy-dom は Tailwind を解決しない）。`}}},decorators:[e=>(0,g.jsx)(h,{children:(0,g.jsx)(e,{})})],args:{resolvedValuePlacement:`beside`}},y={name:`enum（未指定）`,args:{field:r(`field-label`,l,_()),input:l.input}},b={name:`トークン名から選ぶ`,args:{field:r(`field-label`,s,_()),input:s.input}},x={name:`数値のトークン（解決値あり）`,args:{field:r(`field-label`,a,_()),input:a.input}},S={name:`数値のトークン（解決値を下に添える）`,args:{field:r(`field-label`,a,_()),input:a.input,resolvedValuePlacement:`below`}},C={name:`数値のトークン（解決できない）`,args:{field:r(`field-label`,d,_()),input:d.input}},w={name:`色のトークン（見本あり）`,args:{field:r(`field-label`,p,_()),input:p.input}},T={name:`色のトークン（見本なし）`,args:{field:r(`field-label`,o,_()),input:o.input}},E={name:`数値を打ち込む`,args:{field:r(`field-label`,u,_()),input:u.input}},D={name:`文字を打ち込む`,args:{field:r(`field-label`,f,_()),input:f.input}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "enum（未指定）",
  args: {
    field: fieldOf("field-label", DirectionControl, fn()),
    input: DirectionControl.input
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "トークン名から選ぶ",
  args: {
    field: fieldOf("field-label", TypographyControl, fn()),
    input: TypographyControl.input
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決値あり）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input
  }
}`,...x.parameters?.docs?.source},description:{story:`解決できたトークン。全幅の行なので数値は右に添う。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決値を下に添える）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input,
    resolvedValuePlacement: "below"
  }
}`,...S.parameters?.docs?.source},description:{story:`半幅セルに入るときの添え方。数値が欄の下へ回る。`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決できない）",
  args: {
    field: fieldOf("field-label", DanglingGapControl, fn()),
    input: DanglingGapControl.input
  }
}`,...C.parameters?.docs?.source},description:{story:`ファイル由来の不正な参照。解決値が無いので選択欄だけになる。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "色のトークン（見本あり）",
  args: {
    field: fieldOf("field-label", BackgroundControl, fn()),
    input: BackgroundControl.input
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "色のトークン（見本なし）",
  args: {
    field: fieldOf("field-label", MissingBackgroundControl, fn()),
    input: MissingBackgroundControl.input
  }
}`,...T.parameters?.docs?.source},description:{story:`実在しないトークンを指しているとき。見本が出ず、名前だけが残る。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "数値を打ち込む",
  args: {
    field: fieldOf("field-label", WidthControl, fn()),
    input: WidthControl.input
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "文字を打ち込む",
  args: {
    field: fieldOf("field-label", LabelControl, fn()),
    input: LabelControl.input
  }
}`,...D.parameters?.docs?.source}}},O=[`Enum`,`Token`,`NumericToken`,`NumericTokenBelow`,`DanglingToken`,`ColorToken`,`MissingColorToken`,`NumberInput`,`TextInput`]}))();export{w as ColorToken,C as DanglingToken,y as Enum,T as MissingColorToken,E as NumberInput,x as NumericToken,S as NumericTokenBelow,D as TextInput,b as Token,O as __namedExportsOrder,v as default};