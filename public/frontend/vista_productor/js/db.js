const DB_NAME = "agrotrace_db";
const STORE = "pendientes";

function abrirDB(){

    return new Promise((resolve,reject)=>{

        const request = indexedDB.open(DB_NAME,1);

        request.onupgradeneeded = (e)=>{

            const db = e.target.result;

            db.createObjectStore(STORE,{
                keyPath:"id",
                autoIncrement:true
            });

        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

    });

}

async function guardarOffline(data){

    const db = await abrirDB();

    const tx = db.transaction(STORE,"readwrite");

    tx.objectStore(STORE).add(data);

}