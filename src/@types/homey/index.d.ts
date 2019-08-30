
 declare module 'homey' 
{
  export var env:any;
  import { EventEmitter } from "events";
  export type i18n = string|any;
 // import * as Homey from 'homey';
  export function __(key:i18n):void

  export interface ICapabilities
  {
    capabilityId:string;
  }
  export class SimpleClass extends EventEmitter
  {
    constructor();
    public error(...message:any[]):void;
    public log(...message:any[]):void;
  }
  export class App extends SimpleClass
  {
    constructor(uri:string);
    protected onInit():void;
  }
  export type genericCallbackFunction= (err?:Error,store?:any)=>void;

  export class Device<T>
  {
    public getAvailable():boolean;
    public getCapabilities():Array<ICapabilities>;
    public getCapabilityValue(capabilityId:string):ICapabilities;
    public getClass():string;
    public getData():any;
    public getDriver():Driver<T>;
    public getName():string;
    public getSetting(key:string):any;
    public getSettings():any;
    public getState():any;
    public getStore():any;
    public getStoreKeys():Array<string>;
    public getStoreValue(key:string):any;
    public hasCapability(capabilityId:string):boolean;
    public onAdded():void;
    public onDeleted():void;
    public onInit():void;
    public onRenamed(name:string):void;
    public onSettings(oldSettings:any,newSettings:any,changedKeys:Array<any>,callback:genericCallbackFunction):void;
    public ready(callback:()=>void):void;
    public registerCapabilityListener(capabilityId:string,fn:(value:any,opt:any,callback:genericCallbackFunction)=>void):void;
    public registerMultipleCapabilityListener(capabilityIds:Array<string>,fn:(valueObj:any,optsObj:any,callback:genericCallbackFunction)=>void,timeout:number):void;
    public setAlbumArtImage(image:Image,callback?:(err:Error)=>void):Promise<T>;
    public setAvailable(callback?:genericCallbackFunction):Promise<T>;
    public setCapabilityValue(capabilityId:string,value:any,callback?:genericCallbackFunction):Promise<T>;
    public setSettings(settings:any,callback?:genericCallbackFunction):Promise<T>;
    public setStoreValue(key:string,value:any,callback?:genericCallbackFunction):Promise<T>;
    public setUnavailable(message:string,callback?:genericCallbackFunction):Promise<T>;
    public setWarning(message:string,callback?:genericCallbackFunction):Promise<T>;
    public triggerCapabilityListener(capabilityId:string,value:any,opts:any,callback?:genericCallbackFunction):Promise<T>;
    public unsetStoreValue(key:string,callback?:genericCallbackFunction):Promise<T>;
    public usetWarning(callback?:genericCallbackFunction):Promise<T>;
  }
  export class Driver<T>{
    public getDevice(deviceData:any):Device<T>;
    public getDevices():Array<Device<T>>;
    public onInit():void;
    public onMapDeviceClass(device:Device<T>):Device<T>;
    public onPair(socket:EventEmitter):void;
    public onPairListDevices(data:any,callback:(err:Error,result:Array<Device<T>>)=>void):void;
    public ready(callback:()=>void):void;
  }
  export class Image
  {

  }
  export class FlowArgument
  {
    public registerAutocompleteListener(fn:(query:string,args:any,callback:(err:Error,result:Array<any>)=>void)=>void):FlowArgument;
  }
  export class FlowCard<T> extends EventEmitter
  {
    constructor(id:string);
    getArgument():FlowArgument;
    getArgumentValues(callback:(err:Error,value:Array<any>)=>void):Promise<T>;
    register():T;
    registerRunListener(fn:(args:any,state:any,callback:genericCallbackFunction)=>void):T;
    unregister():void;
  }
  export class FlowCardCondition<T> extends FlowCard<T>
  {
    constructor(id:string);
  }
  export class FlowCardTrigger<T> extends FlowCard <T>
  {
    constructor(id:string);
    trigger(tokens:any,state:any,callback?:genericCallbackFunction):Promise<T>;

  }
  export class FlowCardAction<T> extends FlowCard<T>
  {
    constructor(id:string);

  }
  export class FlowCardTriggerDevice<T> extends FlowCard<T>
  {
    constructor(id:string);
    trigger(device:Device<T>,tokens:any,state:any,callback:genericCallbackFunction):Promise<T>;

  }

  export interface IFlowToken 
  {
    type: string,
    title:string
  }
  export type FlowTokenType= string|number|boolean|Image;
  export class FlowToken<T>
  {
    constructor(id:string,opts:IFlowToken);
    register(callback?:(err:Error,token:FlowToken<T>)=>void):Promise<T>;
    setValue(value:FlowTokenType,callback?:genericCallbackFunction):Promise<T>;
    unregister(callback?:genericCallbackFunction):Promise<T>;
  }
  export interface INotification
  {
    excerpt:string
  }
  export class Notification<T>
  {
    constructor(options:INotification);
    register(callback?:genericCallbackFunction):Promise<T>;
  }
  export class Speaker<T>
  {
    constructor(isActive:boolean,isRegistered:boolean);
    register(speakerState:string,callback?:genericCallbackFunction ):Promise<T>;
    sendCommand(command:string,args:Array<T>,callback?:genericCallbackFunction):Promise<T>;
    setInactive(message:string,callback?:genericCallbackFunction):Promise<T>;
    unregister(callback?:genericCallbackFunction):Promise<T>;
    updateState(state:string,callback?:genericCallbackFunction):Promise<T>;
  }
  export type AudioType = Buffer|string
  export class ManagerAudio
  {
    static playMp3<T>(sampleId:string,sample?: AudioType,callback?:genericCallbackFunction):Promise<T>;
    static playWav<T>(sampleId:string,sample?: AudioType,callback?:genericCallbackFunction):Promise<T>;
    static removeMp3<T>(sampleId:string,callback?:genericCallbackFunction):void;
    static removeWav<T>(sampleId:string,callback?:genericCallbackFunction):void;
  }
  export class Api<T>
  {
    constructor(uri:string);
    delete(path:string,callback?:genericCallbackFunction):Promise<T>;
    get(path:string,callback?:genericCallbackFunction):Promise<T>;
    post(path:string,body:any,callback?:genericCallbackFunction):Promise<T>;
    put(path:string,body:any,callback?:genericCallbackFunction):Promise<T>;
    register():Api<T>;
    unregister():void;
  }
  export class ApiApp<T> extends Api<T>
  {
    constructor(appId:string);
    getInstalled(callback?:(err:Error,installed:boolean)=>void):Promise<T>;
    getVersion(callback?:(err:Error,version:string)=>void):Promise<T>;
  }

  export class ManagerGeolocation extends EventEmitter
  {
    static getAccuracy():number;
    static getLatitude():number;
    static getLongitude():number;
    static getMode():string;
  }
  export class ManagerClock extends EventEmitter
  {
   static getTimezone():string;
  }
  export class CronTask extends EventEmitter
  {

  }
  export type CronWhenType = string|Date;
  export class ManagerCron
  {
    static getTask<T>(name:string,callback?:(err:Error,task:CronTask)=>void):Promise<T>;
    static getTasks<T>(callback?:(err:Error,logs:Array<CronTask>)=>void):Promise<T>;
    static registerTask<T>(name:string,when:CronWhenType,data:any,callback?:(err:Error,task:CronTask)=>void):Promise<T>;
    static unregisterAllTasks<T>(callback?:(err:Error)=>void):Promise<T>;
    static unregisterTask<T>(name:string,callback?:(err:Error)=>void):Promise<T>;
  }

}

