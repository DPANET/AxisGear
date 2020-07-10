'use strict';

import Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode,CLUSTER,BoundCluster} = require('zigbee-clusters');

const maxMoveLevel = 254;
const minMoveLevel = 0;
class AxisDevice extends ZigBeeDevice {

   public async onNodeInit({zclNode}) {
        // enable debugging
        //this.enableDebug();
        //  this.printNode();
        // this.log('Zigbee Added');

        //map onoff capability
        try {

            this.registerCapability('onoff',CLUSTER.LEVEL_CONTROL,
                {
                    get: 'currentLevel',
                    // report: 'currentLevel',
                    set: 'moveToLevel',
                    getOpts:
                    {
                        getOnStart: true,
                        getOnOnline: true,
                    },
                    report:'currentLevel',
                    setParser: (value:any) => (
                        {
                            level: value * maxMoveLevel,
                            transtime: this.getSetting('transtime')
                        }
                    ),

                    reportParser: (value:any) => value / maxMoveLevel
                });

            //map battery capability        
            this.registerCapability('measure_battery',CLUSTER.POWER_CONFIGURATION,
                {
                    get: 'batteryPercentageRemaining',
                    report: 'batteryPercentageRemaining',
                    reportParser: (value:any) => Math.round(value / 2),
                    endpoint:0

                });

            //map dim capability        
            this.registerCapability('dim', CLUSTER.LEVEL_CONTROL,
                {
                    get: 'currentLevel',
                    // report: 'currentLevel',
                    set: 'moveToLevel',
                    getOpts:
                    {
                        getOnStart: true,
                        getOnOnline: true,
                    },
                    report:'currentLevel',
                    setParser: (value:any) => (
                        {
                            level: value * maxMoveLevel,
                            transtime: this.getSetting('transtime')
                        }
                    ),

                    reportParser: (value:any) => (value / maxMoveLevel)
                });
        } catch (err) {
            this.error('failed to register mapping registerCapability ', err);
        }

        // this.registerAttrReportListener(
        //     'genLevelCtrl', // Cluster
        //     'currentLevel', // Attr
        //     1, // Min report interval in seconds (must be greater than 1)
        //     3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
        //     0, // Report change value, if value changed more than this value send a report
        //     this.onControlLevelChangeReport.bind(this)) // Callback with value
        //     .then(() => {
        //         // Registering attr reporting succeeded
        //         this.log('registered attr report listener');
        //     })
        //     .catch((err:Error) => {
        //         // Registering attr reporting failed
        //         this.error('failed to register attr report listener', err);
        //     });
       await this.configureAttributeReporting([
            {
                cluster: CLUSTER.LEVEL_CONTROL,
                attributeName:'currentLevel',
                minInterval: 1,
                maxInterval: 3600,
                minChange:0
            }]);
       
        if (this.hasCapability('measure_battery')) {
            this.registerAttrReportListener(
                'genPowerCfg', // Cluster
                'batteryPercentageRemaining', // Attr
                1, // Min report interval in seconds (must be greater than 1)
                3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
                0, // Report change value, if value changed more than this value send a report
                this.onPowerCfgBatteryPercentageRemainingReport.bind(this),0) // Callback with value
                .then(() => {
                    // Registering attr reporting succeeded
                    this.log('registered attr report listener');
                })
                .catch((err:Error) => {
                    // Registering attr reporting failed
                    this.error('failed to register attr report listener', err);
                });
        }
        //initialize Homey Events

        // Register toggle curtain flow card
        this.initEvents();


    }
    public initEvents():void{
        let toggleBlindAction = new Homey.FlowCardAction<Homey.FlowCardAction<any>>('toggle_blind_action');
        toggleBlindAction
            .register()
            .registerRunListener((args:any, state:any) => {
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
    async OnPowerChangeReport(value:any) {
        this.log("Current On/Off:" + this.getCapabilityValue('onoff'));
        try {
            await this.setCapabilityValue('onoff', value);
        }
        catch (err) {
            this.error('failed to set Onoff setCapabilityValue', err);

        }
    }
    async  onControlLevelChangeReport(value: any) {
        let level = (value / maxMoveLevel);
        this.log("Sent Value:" + level);
        this.log("Current Dim:" + this.getCapabilityValue('dim'));
        //   this.log("Current On/Off:"+ this.getCapabilityValue('onoff'));
        //   if (this.getCapabilityValue('dim') !== level)
        try {
            if (this.getCapabilityValue('dim') !== level)
            await this.setCapabilityValue('dim', level);
            // .then(() => { })
            // .catch(err => {
            //     // Registering attr reporting failed
            //     this.error('failed to set dim setCapabilityValue', err);
            // });

            // update onOff capability
          if (this.getCapabilityValue('onoff') !== (level) > 0) 
            await this.setCapabilityValue('onoff', (level) > 0);
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
    onPowerCfgBatteryPercentageRemainingReport(value: any) {
        let batteryValue = Math.round(value / 2);
    //    this.log('onPowerCfgBatteryPercentageRemainingReport ',batteryValue );
        this.setCapabilityValue('measure_battery', batteryValue)
            .then(() => { })
            .catch((err:Error) => {
                // Registering attr reporting failed
                this.error('failed to set battery setCapabilityValue', err);
            });
    }
  async  toggleBlind(device: any) {

        let state = !device.getCapabilityValue('onoff');
        // this.log(state);
        let result = true;
    // Get ZigBeeNode instance from ManagerZigBee
    let node = await this.homey.zigbee.getNode(this);

    // Create ZCLNode instance
    let zclNode = new ZCLNode(node);
        return new Promise((resolve, reject) => {
            zclNode.endpoints[0].clusters.onOff.toggle()
                .then(() => {
                    this.setCapabilityValue('onoff', state)
                        .then(() => {
                            // this.log('success set capablities');
                            resolve(result);
                        })
                        .catch((err:Error) => {
                            this.error('failed to toggle ', err);
                            resolve(!result);
                        })
                })
                .catch((err:Error) => {
                    this.error('failed to set on/off setCapabilityValue based on action', err);
                    resolve(!result);
                });


        });
    }

}

class LevelControlBoundCluster extends BoundCluster {

    constructor({ onMove }) {
        super();
        this._onMove = onMove;
      }
    
      // This function name is directly derived from the `move`
      // command in `zigbee-clusters/lib/clusters/levelControl.js`
      // the payload received is the payload specified in
      // `LevelControlCluster.COMMANDS.move.args`
     async move(payload:any) {
        await this.onControlLevelChangeReport(payload);
      }

      async  onControlLevelChangeReport(value: any) {
        let level = (value / maxMoveLevel);
        this.log("Sent Value:" + level);
        this.log("Current Dim:" + this.getCapabilityValue('dim'));
        //   this.log("Current On/Off:"+ this.getCapabilityValue('onoff'));
        //   if (this.getCapabilityValue('dim') !== level)
        try {
            if (this.getCapabilityValue('dim') !== level)
            await this.setCapabilityValue('dim', level);
            // .then(() => { })
            // .catch(err => {
            //     // Registering attr reporting failed
            //     this.error('failed to set dim setCapabilityValue', err);
            // });

            // update onOff capability
          if (this.getCapabilityValue('onoff') !== (level) > 0) 
            await this.setCapabilityValue('onoff', (level) > 0);
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
}
module.exports = AxisDevice;
module.exports = LevelControlBoundCluster;