import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyMetaSignature } from "./meta-signature.js";

const secret="test-app-secret";
function request(signature:string|undefined,body:string){return{rawBody:Buffer.from(body),header:(name:string)=>name.toLowerCase()==="x-hub-signature-256"?signature:undefined} as never;}
function sign(body:string){return`sha256=${crypto.createHmac("sha256",secret).update(Buffer.from(body)).digest("hex")}`;}

test("accepts a valid Meta signature",()=>{process.env.WHATSAPP_APP_SECRET=secret;const body='{"object":"whatsapp_business_account"}';assert.equal(verifyMetaSignature(request(sign(body),body)),true);});
test("rejects an invalid signature",()=>{process.env.WHATSAPP_APP_SECRET=secret;const body='{"object":"whatsapp_business_account"}';assert.equal(verifyMetaSignature(request("sha256=invalid",body)),false);});
test("rejects a missing signature or raw body",()=>{process.env.WHATSAPP_APP_SECRET=secret;assert.equal(verifyMetaSignature(request(undefined,"body")),false);const req={header:()=>sign("body")} as never;assert.equal(verifyMetaSignature(req),false);});
