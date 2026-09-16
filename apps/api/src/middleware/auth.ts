import type { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export type BusinessRole = "owner" | "admin" | "member";
export interface AuthContext { userId:string; businessId:string; role:BusinessRole; }
export interface AuthenticatedRequest extends Request { auth?:AuthContext; }

function getBearerToken(req:Request):string|null { const authorization=req.header("Authorization"); if(!authorization)return null; const [scheme,token]=authorization.split(" "); if(scheme?.toLowerCase()!=="bearer"||!token)return null; return token; }

export function getRequestedBusinessId(req:Request):string|null {
  const value=req.header("X-Business-Id")?.trim();
  return value || null;
}

export function isValidBusinessRole(role:unknown):role is BusinessRole {
  return role === "owner" || role === "admin" || role === "member";
}

export function membershipMatchesRequestedBusiness(
  membership: { business_id: string } | null | undefined,
  requestedBusinessId: string | null,
): boolean {
  return Boolean(membership && (!requestedBusinessId || membership.business_id === requestedBusinessId));
}

export async function requireAuth(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void>{
  try{
    const token=getBearerToken(req);
    if(!token){res.status(401).json({error:"Unauthorized",message:"A valid Bearer access token is required."});return;}
    const{data:{user},error:userError}=await supabase.auth.getUser(token);
    if(userError||!user){res.status(401).json({error:"Unauthorized",message:"The access token is invalid or expired."});return;}

    const requestedBusinessId=getRequestedBusinessId(req);
    let membershipQuery=supabase.from("business_memberships").select("business_id, role, created_at").eq("user_id",user.id);
    if(requestedBusinessId) membershipQuery=membershipQuery.eq("business_id",requestedBusinessId);
    const{data:membership,error:membershipError}=await membershipQuery.order("created_at",{ascending:true}).limit(1).maybeSingle();

    if(membershipError){console.error("Membership lookup failed:",membershipError);res.status(500).json({error:"Internal Server Error",message:"Unable to determine business membership."});return;}
    if(!membership || !membershipMatchesRequestedBusiness(membership, requestedBusinessId)){
      res.status(403).json({error:"Forbidden",message:requestedBusinessId?"You are not a member of the selected business.":"The authenticated user does not belong to a business."});
      return;
    }

    const{data:business,error:businessError}=await supabase.from("businesses").select("status").eq("id",membership.business_id).maybeSingle();
    if(businessError){console.error("Business status lookup failed:",businessError);res.status(500).json({error:"Internal Server Error",message:"Unable to determine business status."});return;}
    if(!business){res.status(403).json({error:"Forbidden",message:"The business workspace no longer exists."});return;}
    if(business.status!=="active"){res.status(403).json({error:"Business Inactive",message:`This business workspace is ${business.status}. Contact a platform administrator.`});return;}

    const role=membership.role as BusinessRole;
    if(!isValidBusinessRole(role)){res.status(403).json({error:"Forbidden",message:"The user's business role is invalid."});return;}
    req.auth={userId:user.id,businessId:membership.business_id,role};
    next();
  }catch(error){console.error("Authentication middleware failed:",error);res.status(500).json({error:"Internal Server Error",message:"Authentication could not be completed."});}
}

export function requireManager(req:AuthenticatedRequest,res:Response,next:NextFunction):void{if(req.auth?.role!=="owner"&&req.auth?.role!=="admin"){res.status(403).json({error:"Forbidden",message:"Only business owners and admins can perform this action."});return;}next();}
