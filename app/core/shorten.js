/** Optional, user-triggered shortening only. No account, scripts, or detailed click statistics. */
export function createShortener({fetcher=fetch,now=Date.now,timeoutMs=10000}={}){
  const cache=new Map();let retryAfter=0;
  return async link=>{
    const target=new URL(link);
    if(!['https:','http:'].includes(target.protocol)||link.length>5000)throw new Error('is.gd accepts web links up to 5,000 characters.');
    if(cache.has(link))return cache.get(link);
    if(now()<retryAfter)throw new Error('is.gd rate limit reached. Wait one minute before shortening again.');
    const endpoint=new URL('https://is.gd/create.php');endpoint.search=new URLSearchParams({format:'json',url:link});
    let data;
    try{
      const response=await fetcher(endpoint.href,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(timeoutMs)});
      data=await response.json();
      if(!response.ok&&data?.errorcode!==3)throw new Error('HTTP '+response.status);
    }catch{throw new Error('is.gd could not be reached or returned an invalid response.');}
    if(data?.errorcode===3){retryAfter=now()+60000;throw new Error('is.gd rate limit reached. Wait one minute before shortening again.');}
    if(data?.errorcode||typeof data?.shorturl!=='string'||!/^https:\/\/is\.gd\/[A-Za-z0-9_]{5,30}$/.test(data.shorturl))throw new Error('is.gd could not shorten this build link.');
    if(cache.size>=20)cache.delete(cache.keys().next().value);
    cache.set(link,data.shorturl);return data.shorturl;
  };
}
