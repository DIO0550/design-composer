import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-D16BNjX-.js";import{i as n,r,t as i}from"./prop-field-Ct1qq1Ud.js";import{_ as a,a as o,g as s,i as c,l,o as u,p as d,r as f,s as p,t as m,u as h,v as g}from"./panel-controls-BM-6lrO2.js";import{n as _,t as v}from"./panel-frame-B9J5lG90.js";var y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P;e((()=>{g(),_(),n(),y=t(),{fn:b}=__STORYBOOK_MODULE_TEST__,x={title:`features/editor/features/inspector/PropertyPanel/PropField`,component:i,parameters:{layout:`padded`,docs:{description:{component:`値域ごとの入力欄。

7 種類を並べるのは、どの種別がどの見た目になるかがスキーマの走査だけで決まり、
画面から確かめる手段が視覚差分しか無いため（happy-dom は Tailwind を解決しない）。`}}},decorators:[e=>(0,y.jsx)(v,{children:(0,y.jsx)(e,{})})],args:{resolvedValuePlacement:`beside`}},S={name:`enum（未指定）`,args:{field:r(`field-label`,o,b()),input:o.input}},C={name:`トークン名から選ぶ`,args:{field:r(`field-label`,d,b()),input:d.input}},w={name:`数値のトークン（解決値あり）`,args:{field:r(`field-label`,u,b()),input:u.input}},T={name:`数値のトークン（解決値を下に添える）`,args:{field:r(`field-label`,u,b()),input:u.input,resolvedValuePlacement:`below`}},E={name:`数値のトークン（解決できない）`,args:{field:r(`field-label`,c,b()),input:c.input}},D={name:`色のトークン（見本あり）`,args:{field:r(`field-label`,m,b()),input:m.input}},O={name:`色のトークン（見本なし）`,args:{field:r(`field-label`,h,b()),input:h.input}},k={name:`塗りのトークン（色）`,args:{field:r(`field-label`,f,b()),input:f.input}},A={name:`塗りのトークン（解決しない名前）`,args:{field:r(`field-label`,s,b()),input:s.input}},j={name:`塗りのトークン（グラデーション）`,args:{field:r(`field-label`,p,b()),input:p.input}},M={name:`数値を打ち込む`,args:{field:r(`field-label`,a,b()),input:a.input}},N={name:`文字を打ち込む`,args:{field:r(`field-label`,l,b()),input:l.input}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "enum（未指定）",
  args: {
    field: fieldOf("field-label", DirectionControl, fn()),
    input: DirectionControl.input
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "トークン名から選ぶ",
  args: {
    field: fieldOf("field-label", TypographyControl, fn()),
    input: TypographyControl.input
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決値あり）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input
  }
}`,...w.parameters?.docs?.source},description:{story:`解決できたトークン。全幅の行なので数値は右に添う。`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決値を下に添える）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input,
    resolvedValuePlacement: "below"
  }
}`,...T.parameters?.docs?.source},description:{story:`半幅セルに入るときの添え方。数値が欄の下へ回る。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "数値のトークン（解決できない）",
  args: {
    field: fieldOf("field-label", DanglingGapControl, fn()),
    input: DanglingGapControl.input
  }
}`,...E.parameters?.docs?.source},description:{story:`ファイル由来の不正な参照。解決値が無いので選択欄だけになる。`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "色のトークン（見本あり）",
  args: {
    field: fieldOf("field-label", BackgroundControl, fn()),
    input: BackgroundControl.input
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "色のトークン（見本なし）",
  args: {
    field: fieldOf("field-label", MissingBackgroundControl, fn()),
    input: MissingBackgroundControl.input
  }
}`,...O.parameters?.docs?.source},description:{story:`実在しないトークンを指しているとき。見本が出ず、名前だけが残る。`,...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "塗りのトークン（色）",
  args: {
    field: fieldOf("field-label", ColorPaintControl, fn()),
    input: ColorPaintControl.input
  }
}`,...k.parameters?.docs?.source},description:{story:`塗りの欄が colors を指しているとき。一覧は種別ごとの節に分かれる。`,...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "塗りのトークン（解決しない名前）",
  args: {
    field: fieldOf("field-label", UnresolvedPaintControl, fn()),
    input: UnresolvedPaintControl.input
  }
}`,...A.parameters?.docs?.source},description:{story:`塗りの欄がどちらの種別にも無い名前を指しているとき。見本が出ず、名前は節の外に出る。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "塗りのトークン（グラデーション）",
  args: {
    field: fieldOf("field-label", GradientPaintControl, fn()),
    input: GradientPaintControl.input
  }
}`,...j.parameters?.docs?.source},description:{story:`塗りの欄が gradients を指しているとき。見本が階調になる。`,...j.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "数値を打ち込む",
  args: {
    field: fieldOf("field-label", WidthControl, fn()),
    input: WidthControl.input
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "文字を打ち込む",
  args: {
    field: fieldOf("field-label", LabelControl, fn()),
    input: LabelControl.input
  }
}`,...N.parameters?.docs?.source}}},P=[`Enum`,`Token`,`NumericToken`,`NumericTokenBelow`,`DanglingToken`,`ColorToken`,`MissingColorToken`,`ColorPaintToken`,`UnresolvedPaintToken`,`GradientPaintToken`,`NumberInput`,`TextInput`]}))();export{k as ColorPaintToken,D as ColorToken,E as DanglingToken,S as Enum,j as GradientPaintToken,O as MissingColorToken,M as NumberInput,w as NumericToken,T as NumericTokenBelow,N as TextInput,C as Token,A as UnresolvedPaintToken,P as __namedExportsOrder,x as default};