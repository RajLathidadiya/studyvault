import { NextResponse } from "next/server";
import { requireAdmin, supabaseRest } from "@/lib/supabase-rest";
const slugify = (value:string) => value.toLowerCase().trim().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export async function GET(request: Request) {
  try {
    const u = new URL(request.url); const board=u.searchParams.get("board"); const subject=u.searchParams.get("subject");
    let q="/rest/v1/chapters?select=id,board,subject,name,slug&order=name.asc";
    if(board) q+=`&board=eq.${encodeURIComponent(board)}`; if(subject) q+=`&subject=eq.${encodeURIComponent(subject)}`;
    return NextResponse.json({ chapters: await supabaseRest(q) });
  } catch(error){ return NextResponse.json({ chapters:[], error:error instanceof Error?error.message:"Database unavailable" },{status:503}); }
}
export async function POST(request:Request){
  try{ const {user}=await requireAdmin(); const {board,subject,name}=await request.json(); if(!board||!subject||!name?.trim()) return NextResponse.json({error:"Board, subject and chapter name are required."},{status:400}); const rows=await supabaseRest("/rest/v1/chapters",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({board,subject,name:name.trim(),slug:slugify(name),created_by:user.id})},true); return NextResponse.json({ok:true,chapter:Array.isArray(rows)?rows[0]:rows}); }
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not add chapter."},{status:400});}
}
export async function DELETE(request:Request){
  try{await requireAdmin(); const u=new URL(request.url); const id=u.searchParams.get("id"); const slug=u.searchParams.get("slug"); const board=u.searchParams.get("board"); const subject=u.searchParams.get("subject"); if(!id && !slug)return NextResponse.json({error:"Chapter id required."},{status:400}); let q="/rest/v1/chapters?"; if(id) q+=`id=eq.${encodeURIComponent(id)}`; else q+=`slug=eq.${encodeURIComponent(slug!)}&board=eq.${encodeURIComponent(board||"")}&subject=eq.${encodeURIComponent(subject||"")}`; await supabaseRest(q,{method:"DELETE"},true); return NextResponse.json({ok:true});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not delete chapter."},{status:403});}
}
