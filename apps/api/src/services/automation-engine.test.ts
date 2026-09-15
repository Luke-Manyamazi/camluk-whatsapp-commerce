import test from "node:test";
import assert from "node:assert/strict";
import { automationRuleMatches, normalizeAutomationText } from "./automation-engine.js";
import type { AutomationRule } from "./automation.js";

function rule(overrides:Partial<AutomationRule>={}):AutomationRule{return{id:"rule-1",business_id:"business-1",name:"Website enquiry",description:null,enabled:true,priority:10,match_type:"any",keywords:["website","web design"],response_text:"Thanks",action_type:"send_reply",action_config:{},created_at:"",updated_at:"",...overrides};}

test("normalizes whitespace and case",()=>{assert.equal(normalizeAutomationText("  I   Need a WEBSITE  "),"i need a website");});
test("matches any keyword",()=>{assert.equal(automationRuleMatches("I need a website for my business",rule()),true);assert.equal(automationRuleMatches("Tell me about your prices",rule()),false);});
test("requires every keyword for all matching",()=>{const r=rule({match_type:"all",keywords:["website","business"]});assert.equal(automationRuleMatches("I need a website for my business",r),true);assert.equal(automationRuleMatches("I need a website",r),false);});
test("exact matching is case and whitespace insensitive",()=>{const r=rule({match_type:"exact",keywords:["need a website"]});assert.equal(automationRuleMatches(" NEED A   WEBSITE ",r),true);assert.equal(automationRuleMatches("I need a website",r),false);});
test("contains matching supports phrases",()=>{const r=rule({match_type:"contains",keywords:["web development"]});assert.equal(automationRuleMatches("Can you quote web development for me?",r),true);});
test("disabled and empty rules never match",()=>{assert.equal(automationRuleMatches("website",rule({enabled:false})),false);assert.equal(automationRuleMatches("website",rule({keywords:[]})),false);});
