'use strict';

import { watchFile } from "fs";

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER, BoundCluster } = require('zigbee-clusters');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
const OnOffBoundCluster = require("../../lib/OnOffBoundCluster")
const maxMoveLevel = 254;
const minMoveLevel = 0;
const { Util } = require('homey-zigbeedriver');
Util.debugZigbeeClusters(true);
class AxisDevice extends ZigBeeDevice {

    public async onNodeInit({ zclNode }) {
        // enable debugging
        // this.enableDebug();
        this.printNode();
        // this.log('Zigbee Added');
       
        try {


            // this.registerCapability('onoff', CLUSTER.ON_OFF, {
            //     // This is often just a string, but can be a function as well
            //     set: (setValue:any)=> setValue ? 'setOn' : 'setOff',
            //     get: 'onOff',
            //     report: 'onOff',
            //    // setParser:(setValue:any)=> setValue ? 'setOn' : 'setOff',
            //     //setParser: () => ({}),
            //     reportParser: (report: any) => {
            //         if (report.onOff === true) return true;
            //        // if (report === true) return true;
            //         return false
            //     },
            //     getOpts:
            //     {
            //        getOnStart: true,
            //        getOnOnline: true

            //     }
            //     ,
            //     reportOpts: {
            //         configureAttributeReporting: {
            //             attributeName: "onOff",
            //             minInterval: 0, // No minimum reporting interval
            //             maxInterval: 3600, // Maximally every ~16 hours
            //             minChange: 0, // Report when value changed by 0,
            //             endpointId: 1
            //         }
            //     }
            // }
            // );
            this.registerCapabilityListener('onoff', this.controlOnOffCluster.bind(this));
            this.registerCapabilityListener('dim', this.controlOnOffCluster.bind(this));

            // this.registerCapability('dim', CLUSTER.LEVEL_CONTROL,
            //     {
            //         get: 'currentLevel',
            //         set: 'moveToLevelWithOnOff',
            //         report: 'currentLevel',
            //         getOpts:
            //         {
            //             //pollInterval: 3600,
            //             getOnStart: true,
            //             getOnOnline: true

            //         },
            //        // setParser: (value: any) => ({ level: value * maxMoveLevel }),
            //         reportParser: (value: any) => value / maxMoveLevel,
            //         reportOpts: {
            //             configureAttributeReporting: {
            //                 attributeName: "currentLevel",
            //                 minInterval: 0, // No minimum reporting interval
            //                 maxInterval: 3600, // Maximally every ~16 hours
            //                 minChange: 0, // Report when value changed by 0,
            //                 endpointId: 1
            //             }
            //         }
            //     }
            // );
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {

                get: 'batteryPercentageRemaining',
                report: 'batteryPercentageRemaining',
                reportParser: (value: any) => Math.round(value / 2),
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        attributeName:"batteryPercentageRemaining",
                        minInterval: 0, // No minimum reporting interval
                        maxInterval: 60000, // Maximally every ~16 hours
                        minChange: 0, // Report when value changed by 5
                        endpointId: 1
                    },
                },
            });
            this.log("Battery Capability is added.....")
            await this.configureAttributeReporting([
                {
                    cluster: CLUSTER.LEVEL_CONTROL,
                    attributeName:'currentLevel',
                    minInterval: 0,
                    maxInterval: 3600,
                    minChange:0
                },
                {
                cluster: CLUSTER.ON_OFF,
                attributeName:'onOff',
                minInterval: 0,
                maxInterval: 3600,
                minChange:0
                }
            ]);
            zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].on('attr.currentLevel', this.onControlLevelChangeReport.bind(this));
            zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', this.onControlLevelChangeReport.bind(this));
         //   zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryPercentageRemaining', this.onPowerCfgBatteryPercentageRemainingReport.bind(this));
            // zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
            //     onMoveWithOnOff: this.onControlLevelChangeReport.bind(this)
            // }));
            this.initEvents();
        }
        catch (err) {
            this.log(err);
        }

    }

    public initEvents(): void {
        let toggleBlindAction = this.homey.flow.getActionCard('toggle_blind_action');
        toggleBlindAction
            .registerRunListener((args: any, state: any) => {
                return this.toggleBlind(args.my_device)
                    .then((result) => {
                        return result;
                    })
                    .catch((err) => {
                        this.error('failed to toggle blind', err);
                        return false;
                    });

            });
    }
    async controlOnOffCluster(value: boolean): Promise<any> {
        //let current:any = await this.getClusterCapabilityValue('onoff', CLUSTER.ON_OFF);
        //this.log("Current On/Off:" + current);
        this.log("Value Recieved: " + value);
        let dim:number = 0;
        if(typeof value == 'boolean')
        dim= value ? maxMoveLevel : 0;
        else
        dim= value * maxMoveLevel;
        
        try {
            //  await this.setCapabilityValue('onoff', value);
            //if(current === value)
            let node = await this.homey.zigbee.getNode(this);

            // Create ZCLNode instance
            let zclNode = new ZCLNode(node);
          
          let result = await   zclNode.endpoints[1].clusters.levelControl.moveToLevelWithOnOff({level:dim});
          this.log("Dim Return :"+ dim);
          this.log("Result Return :"+ result);
          await this.wait(1000);
          if (dim === 0)
          {
            await this.setCapabilityValue('onoff', false);
            await this.setCapabilityValue('dim', (dim / maxMoveLevel))
          }
          else if (this.getCapabilityValue('onoff') === false && dim > 0)
          {
            await this.setCapabilityValue('onoff', true);
            await this.setCapabilityValue('dim', (dim / maxMoveLevel))
          }
            //await this.setClusterCapabilityValue('dim', CLUSTER.LEVEL_CONTROL, (value) ? 1 : 0);
            this.log("Current Dim:" + this.getCapabilityValue('dim'));
            this.log("Current Dim:" + this.getCapabilityValue('onoff'));
            //await this.setCapabilityValue('onoff', value);
        }
        catch (err) {
            this.error('failed to set On/Off setCapabilityValue', err);
            return false;
        }
        return true;
    }
    async onPowerCfgBatteryPercentageRemainingReport(value: any) {
        let batteryValue = Math.round(value / 2);
        this.log('onPowerCfgBatteryPercentageRemainingReport ',batteryValue );
        try{

            await  this.setCapabilityValue('measure_battery', batteryValue);
        }
        catch(err)
        {
            this.error('failed to set battery setCapabilityValue '+ batteryValue, err);
        }
        
    }
    async toggleBlind(device: any) {
        try{
            let state = !device.getCapabilityValue('onoff');
           let result=await this.controlOnOffCluster(state);
            // this.log(state);
           // let result = true;
            // // Get ZigBeeNode instance from ManagerZigBee
            // let node = await this.homey.zigbee.getNode(this);
 
            // // Create ZCLNode instance
            // let zclNode = new ZCLNode(node);

            // await  zclNode.endpoints[1].clusters.onOff.toggle();
            // await  this.setCapabilityValue('onoff', state);
            return result;
        }
        catch(err)
        {
            this.error('failed to set on/off setCapabilityValue based on action', err);
            return false;
        }
    }
    async onControlLevelChangeReport(value: any) {
        let level = (value / maxMoveLevel);
        this.log("i'm running");
        this.log("Sent Value:" + level);
        this.log("Current Dim:" + this.getCapabilityValue('dim'));
        this.log("Current Dim:" + this.getCapabilityValue('onoff'));
        //   this.log("Current On/Off:"+ this.getCapabilityValue('onoff'));
        //   if (this.getCapabilityValue('dim') !== level)
        try {
           await this.setCapabilityValue('onoff', (value === 0 ) ? false : true);
           await this.setCapabilityValue('dim',(value)? 1:0);
            // if (this.getCapabilityValue('dim') !== level)
            //     await this.setCapabilityValue('dim', level);
            // .then(() => { })
            // .catch(err => {
            //     // Registering attr reporting failed
            //     this.error('failed to set dim setCapabilityValue', err);
            // });

            // update onOff capability
            // if (this.getCapabilityValue('onoff') !== (level) > 0)
            //     await this.setCapabilityValue('onoff', (level) > 0);
            // .then(() => { })
            // .catch(err => {
            //     // Registering attr reporting failed
            //     this.error('failed to set on/off setCapabilityValue', err);
            // });
        }
        catch (err) {
            this.error('failed to set control change setCapabilityValue', err);

        }
    }
    async wait(timeout:number) {
        if (typeof timeout !== 'number') throw new TypeError('expected_timeout_number');
        return new Promise(resolve => setTimeout(resolve, timeout));
      }
}


module.exports = AxisDevice;
//module.exports = LevelControlBoundCluster;