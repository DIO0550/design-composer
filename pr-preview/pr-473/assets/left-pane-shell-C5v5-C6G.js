import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";function n({children:e}){return(0,r.jsx)(`div`,{className:i,children:e})}var r,i,a=e((()=>{r=t(),i=`w-[15.5rem] border border-gray-300 bg-white`;try{n.displayName=`LeftPaneShell`,n.__docgenInfo={description:`ストーリーの中で左ペインのパネル（\`LeftPanePanel\`）の代わりに置く枠。パネルに出る部品を
実画面と同じ幅で見るために使う。

殻が持つのは幅と枠線と地色だけで、余白と高さはストーリーごとの都合なので children 側が付ける。
横断層に置くのは、左ペインを真似ているストーリーが 3 つの feature に散り、幅の綴りが 6 箇所へ
2 通りに割れていたため（#304）。

本物のパネルを使えないのは、幅を持っているのが親のグリッドとレールの引き算で単体では幅が
出ないうえ、横断層から \`features/\` を import できないため。`,displayName:`LeftPaneShell`,filePath:`/home/runner/work/design-composer/design-composer/src/components/__stories__/left-pane-shell.tsx`,methods:[],props:{},tags:{returns:`受け取った中身を、左ペインのパネルと同じ幅の枠に入れたもの`}}}catch{}}));export{a as n,n as t};