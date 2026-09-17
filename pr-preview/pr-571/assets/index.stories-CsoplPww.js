import{n as e}from"./chunk-BneVvdWh.js";import{i as t,r as n}from"./ArrayEx-CtQdU7_T.js";import{n as r,t as i}from"./Option-CPpfsGoD.js";import{t as a}from"./jsx-runtime-D16BNjX-.js";import{i as o,o as s,r as c}from"./artboard-canvas-C0UUj_j4.js";import{i as l,t as ee}from"./document-open-failure-yDOxMaRq.js";import{n as te,t as u}from"./opened-documents-C1tVvglx.js";import{a as ne,c as re,i as ie,n as ae,o as oe,s as se,t as ce,u as le}from"./document-start-CHMzDL5z.js";import{a as ue,i as de}from"./document-ipc-BBIan5FI.js";import{n as fe,t as pe}from"./document-json-DEvIDwj_.js";import{i as me,n as he,r as ge,t as _e}from"./document-tab-bar-DVb67czj.js";import{n as ve,r as ye,t as be}from"./document-error-list-IoxK6mJR.js";import{f as xe,g as Se,h as Ce,m as we}from"./editor-top-bar-DgiEPDNt.js";import{a as Te,c as d,i as Ee,l as f,n as De,o as Oe,r as ke,s as p,t as Ae}from"./opened-document-editor-D-iin5UK.js";function je(e){let t=Object.values(m).find(t=>t===e);return i.fromNullable(t)}var m,h,g,Me=e((()=>{r(),t(),m={Open:`open`,Create:`create`},h=`document-menu`,g={create(e){return{async subscribeCommand(t){try{let r=await e.listen(h,e=>{let n=je(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),_,Ne=e((()=>{d(),Me(),_={create(){let e=p.create(h);return{menu:g.create(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}}));function Pe(e){if(typeof e!=`object`||!e)return!1;let{message:t}=e;return typeof t==`string`}function Fe(e){return Pe(e)?e:{message:String(e)}}function v(e){return e===null?n.ok(i.none):typeof e==`string`?n.ok(i.some(e)):n.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}var y,Ie=e((()=>{ue(),r(),t(),y={create(e){let t=de.caller(e,Fe);return{async load(){return n.flatMap(await t(`load_app_state`,{}),v)},async save(e){return n.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}}}));function b(e){return Promise.reject({message:`app-state.json: ${e}`})}var x,Le=e((()=>{d(),r(),Ie(),x={create(e){let t=e,n=!1,r=!1,a=()=>n?b(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?b(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):f(`save_app_state: content が文字列でない`);return{ipc:y.create({invoke(e,t){switch(e){case`load_app_state`:return a();case`save_app_state`:return o(t.content);default:return f(`Command ${e} not found`)}},listen(e){return f(`Event ${e} not emitted`)}}),storedContent(){return i.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}}}));async function S(e){try{return n.ok(await e())}catch(e){return n.err({message:String(e)})}}var C,w,T,Re=e((()=>{t(),C={name:`Design Composer ドキュメント`,extensions:[`dcmp`]},w=`untitled.dcmp`,T={create(e){return{chooseOpenPath(){return S(()=>e.chooseOpenPath(C))},chooseSavePath(){return S(()=>e.chooseSavePath(C,w))}}}}}));function E(e){switch(e.kind){case`chosen`:return Promise.resolve(i.some(e.path));case`canceled`:return Promise.resolve(i.none);case`failed`:return Promise.reject(Error(e.message))}}var D,O,k,ze=e((()=>{r(),Re(),D={kind:`canceled`},O={Canceled:D,chosen(e){return{kind:`chosen`,path:e}},failed(e){return{kind:`failed`,message:e}}},k={create(e){return{dialog:T.create({chooseOpenPath(){return E(e.open)},chooseSavePath(){return E(e.save)}})}}}}));function A(e){if(typeof e!=`object`||!e)return i.none;let{paths:t}=e;return!Array.isArray(t)||!t.every(e=>typeof e==`string`)?i.none:i.some(t)}var j,M,Be=e((()=>{r(),t(),j=`tauri://drag-drop`,M={create(e){return{async subscribeDropped(t){try{let r=await e.listen(j,e=>{let n=A(e);i.isSome(n)&&t(n.value)});return n.ok(r)}catch(e){return n.err({message:String(e)})}}}}}})),N,Ve=e((()=>{d(),Be(),N={create(){let e=p.create(j);return{drop:M.create(e.ipc),dropFiles(t){e.deliver({paths:[...t],position:{x:0,y:0}})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}}})),He=e((()=>{l(),ae(),he(),le(),ie()}));function Ue({opened:e,clock:t,ipc:n}){let r=u.activePath(e);return(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:u.documents(e).map(e=>{let i=e.path===r;return(0,F.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,F.jsx)(c,{scope:i?o.Listening:o.Suspended,children:(0,F.jsx)(Ae,{clock:t,ipc:n,opened:e})})},e.path)})})}function P({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:a,actions:o,tabActions:s,commandFailure:c}=ne(t),l=re.failure(n);return i.isSome(n.documents)?(0,F.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,F.jsx)(_e,{opened:n.documents.value,onSelect:s.activate,onClose:s.close}),i.isSome(l)&&(0,F.jsx)(ee,{failure:l.value}),(0,F.jsx)(Ue,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,F.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,F.jsx)(ce,{attempt:n.attempt,actions:o,recentPaths:r,recentFilesFailure:a,commandFailure:c,renderErrors:e=>(0,F.jsx)(be,{errors:e,origin:ve.UnopenedFile})})})})}var F,We=e((()=>{te(),He(),ye(),De(),s(),r(),F=a();try{P.displayName=`EditorScreen`,P.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ load(path: string): Promise<Result<string, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; save(path: string, content: string): Promise<...>; watch(path: string): Promise<...>; unwatch(path: string): Promise<...>; subscribeChanged(listener: (changed: Readonly<...>) => void): ...`}}},tags:{}}}catch{}}));function I(e,t){let n=ke.create(e),r=k.create({open:O.chosen(B),save:O.chosen(`/work/untitled.dcmp`)}),i=N.create(),a=x.create(t===void 0?void 0:oe.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:_.create().menu,drop:i.drop,appState:a.ipc},drop:i}}var L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{me(),we(),Se(),Ne(),Le(),se(),Oe(),ze(),Ee(),fe(),Ve(),We(),{expect:L,screen:R,waitFor:z}=__STORYBOOK_MODULE_TEST__,B=`/work/sample.dcmp`,V=`/work/settings.dcmp`,H=`/work/missing.dcmp`,U={[B]:pe.serialize(Ce.document(xe)),[V]:ge(`settings`)},W=I(U),G=I(U),K=I(U),q=I(U,[B]),J={title:`features/editor/EditorScreen`,component:P,parameters:{layout:`fullscreen`},args:{clock:Te.create().clock,ports:W.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:q.ports}},Z={name:`複数開いている`,args:{ports:G.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),G.drop.dropFiles([B,V]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:K.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),K.drop.dropFiles([B]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),K.drop.dropFiles([H]),await z(()=>{L(R.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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