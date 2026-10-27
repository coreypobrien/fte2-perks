export function chip(id,width=1,height=1,extra={}){
  return {id,name:id,kind:'Core',tags:[],accepts:[],override:null,shapes:[{width,height,cells:Array.from({length:width*height},(_,i)=>[i%width,Math.floor(i/width)])}],...extra};
}
export function placed(p,x=0,y=0){return {...p,x,y,...p.shapes[0]};}
export function board(width,height,perks,requests=perks.map(p=>({id:p.id,required:false})),extra={}){
  return {width,height,rank:10,rankMask:Array(width*height).fill(0),fixed:[],perks,requests,...extra};
}
