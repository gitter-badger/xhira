// export default function () : number {
//     return 123;
//  }
 
 export function Test() : string {
     return 'pinoooo';
 }

export class Triangle { /* ... */ }
export class Square { /* ... */ }

export class User {

    constructor (private _name : string,
                private _email : string) {}
    
    get name () : string  { return this._name; }
    
    get email () : string { return this._email; }

    speak () : void { console.log(this._name); }
}
