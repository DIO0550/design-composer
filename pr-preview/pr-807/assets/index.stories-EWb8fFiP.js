import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CilqoLzs.js";import{n as r,t as i}from"./Option-CPpfsGoD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{n as o,r as s,t as ee}from"./document-error-list-CL76qVEd.js";import{n as c,t as l}from"./document-json-BuY32hZc.js";import{i as u,n as te,r as ne,t as re}from"./document-tab-bar-a5Wa7wW2.js";import{f as ie,g as ae,h as oe,m as se}from"./elapsed-CCMlZtHn.js";import{a as ce,c as d,i as le,l as f,n as ue,o as de,r as fe,s as p,t as pe}from"./opened-document-editor-CplpeEs-.js";import{a as me,i as he}from"./document-ipc-CPDqwQrG.js";import{a as ge,c as _e,i as ve,l as ye,n as be,o as xe,t as Se,u as Ce}from"./document-start-Bfv7ehJT.js";import{n as we,t as m}from"./opened-documents-oY-AvMoN.js";import{a as Te,c as Ee,o as h}from"./use-canvas-view-De095S4J.js";import{i as De,t as Oe}from"./document-open-failure-BwdA8-xY.js";function ke(e){let t=Object.values(g).find(t=>t===e);return i.fromNullable(t)}var g,_,v,Ae=e((()=>{r(),t(),g={Open:`open`,Create:`create`},_=`document-menu`,v={create(e){return{async subscribeCommand(t){try{let r=await e.listen(_,e=>{let n=ke(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),y,je=e((()=>{d(),Ae(),y={create(){let e=p.create(_);return{menu:v.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Me(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Ne(e){return Me(e)?e:{message:String(e)}}function Pe(e){return e===null?n.ok(i.none):typeof e==`string`?n.ok(i.some(e)):n.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var b,Fe=e((()=>{me(),r(),t(),b={create(e){let t=he.caller(e,Ne);return{async load(){return n.flatMap(await t(`load_app_state`,{}),Pe)},async save(e){return n.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function x(e){return Promise.reject({message:`app-state.json: ${e}`})}var S,Ie=e((()=>{d(),r(),Fe(),S={create(e){let t=e,n=!1,r=!1,a=()=>n?x(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?x(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):f(`save_app_state: content が文字列でない`);return{ipc:b.create({invoke(e,t){switch(e){case`load_app_state`:return a();case`save_app_state`:return o(t.content);default:return f(`Command ${e} not found`)}},listen(e){return f(`Event ${e} not emitted`)}}),storedContent(){return i.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}}));async function C(e){try{return n.ok(await e())}catch(e){return n.err({message:String(e)})}}var w,T,E,Le=e((()=>{t(),w={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},T=`untitled.dcmp`,E={create(e){return{chooseOpenPath(){return C(()=>e.chooseOpenPath(w))},chooseSavePath(){return C(()=>e.chooseSavePath(w,T))}}}}}));function D(e){switch(e.kind){case`chosen`:return Promise.resolve(i.some(e.path));case`canceled`:return Promise.resolve(i.none);case`failed`:return Promise.reject(Error(e.message))}}var O,k,A,Re=e((()=>{r(),Le(),O={kind:`canceled`},k={Canceled:O,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},A={create(e){return{dialog:E.create({chooseOpenPath(){return D(e.open)},chooseSavePath(){return D(e.save)}})}}}}));function ze(e){if(typeof e!=`object`||!e)return i.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?i.none:i.some(t)}var j,M,Be=e((()=>{r(),t(),j=`tauri://drag-drop`,M={create(e){return{async subscribeDropped(t){try{let r=await e.listen(j,e=>{let n=ze(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),N,Ve=e((()=>{d(),Be(),N={create(){let e=p.create(j);return{drop:M.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),He=e((()=>{De(),be(),te(),_e(),ve()}));function Ue({opened:e,clock:t,ipc:n}){let r=m.activePath(e);return(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:m.documents(e).map(e=>{let i=e.path===r;return(0,F.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,F.jsx)(Te,{scope:i?h.Listening:h.Suspended,children:(0,F.jsx)(pe,{clock:t,ipc:n,opened:e})})},e.path)})})}function P({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:a,actions:s,tabActions:c,commandFailure:l}=ge(t),u=xe.failure(n);return i.isSome(n.documents)?(0,F.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,F.jsx)(re,{opened:n.documents.value,onSelect:c.activate,onClose:c.close}),i.isSome(u)&&(0,F.jsx)(Oe,{failure:u.value}),(0,F.jsx)(Ue,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,F.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,F.jsx)(Se,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:a,commandFailure:l,renderErrors:e=>(0,F.jsx)(ee,{errors:e,origin:o.UnopenedFile})})})})}var F,We=e((()=>{we(),s(),ue(),He(),Ee(),r(),F=a();try{P.displayName=`EditorScreen`,P.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function I(e,t){let n=fe.create(e),r=A.create({open:k.chosen(B),save:k.chosen(`/work/untitled.dcmp`)}),i=N.create(),a=S.create(t===void 0?void 0:ye.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:y.create().menu,drop:i.drop,appState:a.ipc},drop:i}}var L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{u(),se(),ae(),je(),Ie(),Ce(),de(),Re(),le(),c(),Ve(),We(),{expect:L,screen:R,waitFor:z}=__STORYBOOK_MODULE_TEST__,B=`/work/sample.dcmp`,V=`/work/settings.dcmp`,H=`/work/missing.dcmp`,U={[B]:l.serialize(oe.document(ie)),[V]:ne(`settings`)},W=I(U),G=I(U),K=I(U),q=I(U,[B]),J={title:`features/editor/EditorScreen`,component:P,parameters:{layout:`fullscreen`},args:{clock:ce.create().clock,ports:W.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:q.ports}},Z={name:`複数開いている`,args:{ports:G.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),G.drop.dropFiles([B,V]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:K.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),K.drop.dropFiles([B]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),K.drop.dropFiles([H]),await z(()=>{L(R.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...Y.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "前回のファイルを開いた直後",
  args: {
    ports: restored.ports
  }
}`,...X.parameters?.docs?.source},description:{story:`前回開いていたファイルが起動時にそのまま開いた状態。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    ports: twoOpened.ports
  },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:`2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
（タブ列だけのストーリーでは器との合わせ目が映らない）。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "開いたまま開けなかった",
  args: {
    ports: openFailed.ports
  },
  play: async () => {
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(screen.getByRole("alert", {
        name: "ファイルを開けませんでした"
      })).toBeDefined();
    });
  }
}`,...Q.parameters?.docs?.source},description:{story:`開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,J as default};