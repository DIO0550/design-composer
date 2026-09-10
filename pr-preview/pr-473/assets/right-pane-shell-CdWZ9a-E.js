import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";function n(e){switch(e){case`content`:return``;case`pane`:return`flex h-[32rem] flex-col`}}function r({height:e,children:t}){return(0,i.jsx)(`div`,{className:`${a} ${n(e)}`.trim(),children:t})}var i,a,o=e((()=>{i=t(),a=`w-[18rem] border border-gray-300 bg-white`;try{r.displayName=`RightPaneShell`,r.__docgenInfo={description:`ストーリーの中で右ペインの殻（\`EditorLayout.RightPane\` とそれを載せるグリッドの列）の代わりに
置く枠。帯・本文・その中に並ぶ部品を、実画面と同じ幅で見るために使う。

殻は余白を持たない（帯の下線がペインの両端まで届くことを絵に載せるため、余白は本文が内側に
持つ）。\`pane\` の高さを 32rem に固定しているのは、本文がスクロールを受けていることを視覚差分に
載せるため。

横断層に置くのは、右ペインの殻を真似ているストーリーが \`src/components/\` と 2 つの feature に
散り、幅の綴りが 7 箇所へ写されていたため（#300）。持っている幅は 3 列目（18rem）なので、
左ペインのストーリーがこれを着ると 1rem ずれる（左ペインの枠は #304）。`,displayName:`RightPaneShell`,filePath:`/home/runner/work/design-composer/design-composer/src/components/__stories__/right-pane-shell.tsx`,methods:[],props:{height:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/__stories__/right-pane-shell.tsx`,name:`TypeLiteral`}],description:``,name:`height`,required:!0,tags:{},type:{name:`enum`,raw:`RightPaneShellHeight`,value:[{value:`"content"`},{value:`"pane"`}]}}},tags:{returns:`受け取った中身を、右ペインと同じ幅の枠に入れたもの`}}}catch{}}));export{o as n,r as t};