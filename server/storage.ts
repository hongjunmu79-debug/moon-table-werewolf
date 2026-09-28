import type {Room} from '../lib/game';

export type StoredRoom={state:string;revision:number;expires:number};
export interface RoomStore{
  create(room:Room):Promise<void>;
  read(id:string):Promise<StoredRoom|null>;
  compareAndSwap(id:string,revision:number,room:Room):Promise<boolean>;
}

const memory=new Map<string,StoredRoom>();
export const memoryStore:RoomStore={
  async create(room){if(memory.has(room.id))throw new Error('duplicate room');memory.set(room.id,{state:JSON.stringify(room),revision:0,expires:room.expires});},
  async read(id){return memory.get(id)||null;},
  async compareAndSwap(id,revision,room){const old=memory.get(id);if(!old||old.revision!==revision)return false;memory.set(id,{state:JSON.stringify(room),revision:revision+1,expires:room.expires});return true;},
};

let cloudDbPromise:Promise<any>|undefined;
async function cloudDb(){
  if(!cloudDbPromise)cloudDbPromise=(async()=>{
    const env=process.env.TCB_ENV||process.env.CLOUDBASE_ENV_ID;
    if(!env)throw new Error('CloudBase environment ID is missing');
    const {default:cloudbase}=await import('@cloudbase/js-sdk');
    return cloudbase.init({env}).database();
  })();
  return cloudDbPromise;
}

export const cloudStore:RoomStore={
  async create(room){
    const db=await cloudDb();
    const result=await db.collection('moon_rooms').add({_id:room.id,state:JSON.stringify(room),revision:0,expires:room.expires});
    if(result.code||result.id!==room.id)throw new Error('CloudBase room insert failed');
  },
  async read(id){
    const db=await cloudDb();
    const result=await db.collection('moon_rooms').doc(id).get();
    if(result.code)throw new Error('CloudBase room read failed');
    const row=result.data?.[0];
    return row?{state:row.state,revision:row.revision,expires:row.expires}:null;
  },
  async compareAndSwap(id,revision,room){
    const db=await cloudDb();
    const result=await db.collection('moon_rooms').where({_id:id,revision}).update({state:JSON.stringify(room),revision:revision+1,expires:room.expires});
    if(result.code)throw new Error('CloudBase room update failed');
    return result.updated===1;
  },
};

export function roomStore():RoomStore{return process.env.TEST_MEMORY_DB==='1'?memoryStore:cloudStore;}
