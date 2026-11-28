/** Read a small JSON request without trusting Content-Length. */
export async function readBoundedJson(request:Pick<Request,"body">,maxBytes:number):Promise<unknown>{
  const reader=request.body?.getReader();
  if(!reader)throw Error("Missing body");
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let size=0,text="";
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>maxBytes)throw Error("Body too large");
      text+=decoder.decode(value,{stream:true});
    }
    return JSON.parse(text+decoder.decode());
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
