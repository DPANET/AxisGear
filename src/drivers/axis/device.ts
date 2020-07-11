'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode,CLUSTER,BoundCluster} = require('zigbee-clusters');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
const OnOffBoundCluster = require("../../lib/OnOffBoundCluster")
const maxMoveLevel = 254;
const minMoveLevel = 0;
const { Util } = require('homey-zigbeedriver');
Util.debugZigbeeClusters(true);
class AxisDevice extends ZigBeeDevice {

   public async onNodeInit({zclNode}) {
        // enable debugging
        // this.enableDebug();
          this.printNode();
        // this.log('Zigbee Added');
        this.log("I'm being added.......");
        //map onoff capability
        try {


            this.registerCapability('onoff',  CLUSTER.ON_OFF, {
                // This is often just a string, but can be a function as well
                set: (value:any) => (value ? 'setOn' : 'setOff'),
                  get: 'onOff',
                  report: 'onOff',
                  setParser:(setValue:any)=> setValue ? 'setOn' : 'setOff',
                  reportParser:(report:any)=>{  if (report && report.onOff === true) return true;
                  return false},
                  getOpts:
                  {
                      getOnStart: true,
                      getOnOnline: true,
                      pollInterval: 60000

                  },
                  reportOpts: {
                    configureAttributeReporting: {
                        attributeName:"onOff",
                        minInterval: 0, // No minimum reporting interval
                        maxInterval: 3600, // Maximally every ~16 hours
                        minChange: 0, // Report when value changed by 0,
                        endpointId:1
                    }
                    }
            }
            );

            // this.registerCapability('onOff', CLUSTER.LEVEL_CONTROL,
            // {
            //     get: 'currentLevel',
            //     set: 'moveToLevel',
            //     report:'currentLevel',
            //     getOpts:
            //     {
            //         //pollInterval: 3600,
            //         getOnStart: true,
            //         getOnOnline: true
                    
            //     },
            //    //setParser: (value:any)=>( {level: value * maxMoveLevel} ),
            //     reportParser: (value:any) => value/ maxMoveLevel,
            //     reportOpts: {
            //         configureAttributeReporting: {
            //          // attributeName:"currentLevel",
            //           minInterval: 1, // No minimum reporting interval
            //           maxInterval: 3600, // Maximally every ~16 hours
            //           minChange: 0, // Report when value changed by 0,
            //           endpointId:1
            //         }
            //         }
            //      }
            // );
            this.registerCapability('dim', CLUSTER.LEVEL_CONTROL,
            {
                get: 'currentLevel',
                set: 'moveToLevelWithOnOff',
                report:'currentLevel',
                getOpts:
                {
                    //pollInterval: 3600,
                    getOnStart: true,
                    getOnOnline: true
                    
                },
             //  setParser: (value:any)=>( {level: value * maxMoveLevel} ),
               // reportParser: (value:any) => value/ maxMoveLevel,
                reportOpts: {
                    configureAttributeReporting: {
                      attributeName:"currentLevel",
                      minInterval: 1, // No minimum reporting interval
                      maxInterval: 3600, // Maximally every ~16 hours
                      minChange: 0, // Report when value changed by 0,
                      endpointId:1
                    }
                    }
                 }
            );

            // This maps the `dim` capability to the "levelControl" cluster

            this.log("On/Off Capability is added.....")
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {

                get: 'batteryPercentageRemaining',
                report: 'batteryPercentageRemaining',
                reportParser: (value:any) => Math.round(value / 2),
                getOpts: {
                  getOnStart: true,
                  getOnOnline: true
                },
                reportOpts: {
                  configureAttributeReporting: {
                    minInterval: 0, // No minimum reporting interval
                    maxInterval: 60000, // Maximally every ~16 hours
                    minChange: 5, // Report when value changed by 5
                  },
                },
              });
                this.log("Battery Capability is added.....")
                // await this.configureAttributeReporting([
                //     {
                //         cluster: CLUSTER.LEVEL_CONTROL,
                //         attributeName:'currentLevel',
                //         minInterval: 1,
                //         maxInterval: 3600,
                //         minChange:0
                //     },
                //     {
                //     cluster: CLUSTER.ON_OFF,
                //     attributeName:'onOff',
                //     minInterval: 1,
                //     maxInterval: 3600,
                //     minChange:0
                //     }
                // ]);
         //zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].on('attr.currentLevel', this.onControlLevelChangeReport.bind(this));
      //    zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', this.onSwitchChangeReport.bind(this));

            zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
                onMoveWithOnOff: this.onControlLevelChangeReport.bind(this),
                onMove:this.onControlLevelChangeReport.bind(this)
            }));
    // await this.configureAttributeReporting([
    //     {
    //         cluster: CLUSTER.LEVEL_CONTROL,
    //         attributeName:"currentLevel",
    //         minInterval: 0, // No minimum reporting interval
    //         maxInterval: 3600, // Maximally every ~16 hours
    //         minChange: 0, // Report when value changed by 0,
    //         endpointId:1
    //     }
    //   ]);
      
      //zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (value:any)=>this.onControlLevelChangeReport.bind(this));

    //  zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryPercentageRemaining', this.onPowerCfgBatteryPercentageRemainingReport.bind(this));

        this.initEvents();
            }
        catch(err)
        {
            this.log(err);
        }

    }
   
    public initEvents():void{
        let toggleBlindAction = this.homey.flow.getActionCard('toggle_blind_action');
        toggleBlindAction
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
    async onSwitchChangeReport(value:any) {
        this.log("Current On/Off:" + this.getCapabilityValue('onoff'));
        
        try {
          //  await this.setCapabilityValue('onoff', value);
            await this.setCapabilityValue('dim',value ? 1: 0);
            this.log("Current Dim:" + this.getCapabilityValue('dim'));
        }
        catch (err) {
            this.error('failed to set Dim setCapabilityValue', err);

        }
    }
    async  onControlLevelChangeReport(value: any) {
        let level = (value / maxMoveLevel);
        this.log("i'm running");
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


module.exports = AxisDevice;
//module.exports = LevelControlBoundCluster;