// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer, setDoc, terminate, type Firestore } from "firebase/firestore";

const session=vi.hoisted(()=>({current:null as {auth:Auth;db:Firestore}|null}));
vi.mock("@/shared/lib/firebase",()=>({initFirebase:async()=>session.current}));
import { readCanonicalPreferredSources, writeCanonicalPreferredSource, commitCanonicalPreferredSources } from "../canonical-preference-cloud";

const enabled=process.env.YOMIRRA_FIREBASE_EMULATOR_TEST==="1";
const clients:{app:FirebaseApp;auth:Auth;db:Firestore}[]=[];
const projectId="demo-yomirra-release";
function device(name:string){
  const app=initializeApp({projectId,apiKey:"emulator-only-key",authDomain:"localhost"},name);
  const auth=getAuth(app);
  connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
  const db=getFirestore(app);
  connectFirestoreEmulator(db,"127.0.0.1",8080);
  const client={app,auth,db};
  clients.push(client);
  return client;
}
describe.skipIf(!enabled)("canonical preferences against isolated Firebase Auth + Firestore emulators",()=>{
  let a:ReturnType<typeof device>,b:ReturnType<typeof device>,other:ReturnType<typeof device>,guest:ReturnType<typeof device>,uid:string;
  beforeAll(async()=>{
    if(process.env.FIRESTORE_EMULATOR_HOST!=="127.0.0.1:8080" || process.env.FIREBASE_AUTH_EMULATOR_HOST!=="127.0.0.1:9099"){
      throw new Error("Refusing to run without explicit loopback emulators");
    }
    a=device("device-a");b=device("device-b");other=device("other-account");guest=device("guest");
    const owner=await createUserWithEmailAndPassword(a.auth,"owner@example.test","emulator-password-a");
    uid=owner.user.uid;
    await signInWithEmailAndPassword(b.auth,"owner@example.test","emulator-password-a");
    await createUserWithEmailAndPassword(other.auth,"other@example.test","emulator-password-b");
    expect(b.auth.currentUser?.uid).toBe(uid);
  },30000);
  afterAll(async()=>{
    for(const client of clients) {
      await terminate(client.db);
      await deleteApp(client.app);
    }
    session.current=null;
  },15000);
  it("syncs separate preferences across two authenticated clients without overwriting other titles",async()=>{
    session.current=a;
    await writeCanonicalPreferredSource(uid,"work.a","mangadex");
    session.current=b;
    expect({...await readCanonicalPreferredSources(uid)}).toEqual({"work.a":"mangadex"});
    await writeCanonicalPreferredSource(uid,"work.b","shinigami");
    session.current=a;
    expect({...await readCanonicalPreferredSources(uid)}).toEqual({"work.a":"mangadex","work.b":"shinigami"});
    await writeCanonicalPreferredSource(uid,"work.a",null);
    session.current=b;
    expect({...await readCanonicalPreferredSources(uid)}).toEqual({"work.b":"shinigami"});
  },30000);
  it("rejects a stale guest merge snapshot after the second client updates cloud data",async()=>{
    session.current=a;
    const expected=await readCanonicalPreferredSources(uid);
    session.current=b;
    await writeCanonicalPreferredSource(uid,"merge-fixture","mangadex");
    session.current=a;
    await expect(commitCanonicalPreferredSources(uid,{"guest-choice":"shinigami"},expected)).rejects.toThrow("CANONICAL_PREFERENCE_STALE_SNAPSHOT");
    const current=await readCanonicalPreferredSources(uid);
    expect(current["merge-fixture"]).toBe("mangadex");
    await commitCanonicalPreferredSources(uid,{...current,"guest-choice":"shinigami"},current);
    session.current=b;
    expect((await readCanonicalPreferredSources(uid))["guest-choice"]).toBe("shinigami");
  },30000);
  it("enforces actual Firestore rules for unrelated authenticated accounts and unauthenticated guests",async()=>{
    for(const client of [other,guest]){
      const ref=doc(client.db,"users",uid,"preferences","canonicalSources");
      await expect(getDocFromServer(ref)).rejects.toMatchObject({code:"permission-denied"});
      await expect(setDoc(ref,{values:{"foreign":"shinigami"}},{merge:true})).rejects.toMatchObject({code:"permission-denied"});
      session.current=client;
      await expect(writeCanonicalPreferredSource(uid,"foreign","shinigami")).rejects.toThrow("Authenticated account changed");
    }
    session.current=a;
    expect((await readCanonicalPreferredSources(uid)).foreign).toBeUndefined();
  },30000);
});
