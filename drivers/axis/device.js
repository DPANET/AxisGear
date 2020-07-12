'use strict';
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER, BoundCluster } = require('zigbee-clusters');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
const OnOffBoundCluster = require("../../lib/OnOffBoundCluster");
const maxMoveLevel = 254;
const minMoveLevel = 0;
const { Util } = require('homey-zigbeedriver');
Util.debugZigbeeClusters(true);
class AxisDevice extends ZigBeeDevice {
    async onNodeInit({ zclNode }) {
        // enable debugging
        // this.enableDebug();
        this.printNode();
        // this.log('Zigbee Added');
        try {
            this.registerCapability('onoff', CLUSTER.ON_OFF, {
                // This is often just a string, but can be a function as well
                set: (setValue) => setValue ? 'setOn' : 'setOff',
                get: 'onOff',
                report: 'onOff',
                setParser: (setValue) => setValue ? 'setOn' : 'setOff',
                //setParser: () => ({}),
                reportParser: (report) => {
                    if (report && report.onOff === true)
                        return true;
                    return false;
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        attributeName: "onOff",
                        minInterval: 0,
                        maxInterval: 600,
                        minChange: 0,
                        endpointId: 1
                    }
                }
            });
            this.registerCapability('dim', CLUSTER.LEVEL_CONTROL, {
                get: 'currentLevel',
                set: 'moveToLevelWithOnOff',
                report: 'currentLevel',
                getOpts: {
                    //pollInterval: 3600,
                    getOnStart: true,
                    getOnOnline: true
                },
                setParser: (value) => ({ level: value * maxMoveLevel }),
                reportParser: (value) => value / maxMoveLevel,
                reportOpts: {
                    configureAttributeReporting: {
                        attributeName: "currentLevel",
                        minInterval: 1,
                        maxInterval: 3600,
                        minChange: 0,
                        endpointId: 1
                    }
                }
            });
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
                get: 'batteryPercentageRemaining',
                report: 'batteryPercentageRemaining',
                reportParser: (value) => Math.round(value / 2),
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        attributeName: "batteryPercentageRemaining",
                        minInterval: 0,
                        maxInterval: 60000,
                        minChange: 0,
                        endpointId: 1
                    },
                },
            });
            this.log("Battery Capability is added.....");
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
            zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].on('attr.currentLevel', this.onControlLevelChangeReport.bind(this));
            zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', this.onOnOffChangeReport.bind(this));
            zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryPercentageRemaining', this.onPowerCfgBatteryPercentageRemainingReport.bind(this));
            zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
                onMoveWithOnOff: this.onControlLevelChangeReport.bind(this)
            }));
            this.initEvents();
        }
        catch (err) {
            this.log(err);
        }
    }
    initEvents() {
        let toggleBlindAction = this.homey.flow.getActionCard('toggle_blind_action');
        toggleBlindAction
            .registerRunListener((args, state) => {
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
    async onOnOffChangeReport(value) {
        let current = await this.getClusterCapabilityValue('onoff', CLUSTER.ON_OFF);
        this.log("Current On/Off:" + current);
        this.log("Value Recieved: " + value);
        try {
            //  await this.setCapabilityValue('onoff', value);
            //if(current === value)
            await this.setClusterCapabilityValue('dim', CLUSTER.LEVEL_CONTROL, (value) ? 1 : 0);
            this.log("Current Dim:" + this.getCapabilityValue('dim'));
            this.log("Current Dim:" + this.getCapabilityValue('onoff'));
            //await this.setCapabilityValue('onoff', value);
        }
        catch (err) {
            this.error('failed to set Dim setCapabilityValue', err);
        }
    }
    async onPowerCfgBatteryPercentageRemainingReport(value) {
        let batteryValue = Math.round(value / 2);
        this.log('onPowerCfgBatteryPercentageRemainingReport ', batteryValue);
        try {
            await this.setCapabilityValue('measure_battery', batteryValue);
        }
        catch (err) {
            this.error('failed to set battery setCapabilityValue ' + batteryValue, err);
        }
    }
    async toggleBlind(device) {
        try {
            let state = !device.getCapabilityValue('onoff');
            // this.log(state);
            let result = true;
            // Get ZigBeeNode instance from ManagerZigBee
            let node = await this.homey.zigbee.getNode(this);
            // Create ZCLNode instance
            let zclNode = new ZCLNode(node);
            await zclNode.endpoints[1].clusters.onOff.toggle();
            await this.setCapabilityValue('onoff', state);
            return result;
        }
        catch (err) {
            this.error('failed to set on/off setCapabilityValue based on action', err);
            return false;
        }
    }
    async onControlLevelChangeReport(value) {
        let level = (value / maxMoveLevel);
        this.log("i'm running");
        this.log("Sent Value:" + level);
        this.log("Current Dim:" + this.getCapabilityValue('dim'));
        this.log("Current Dim:" + this.getCapabilityValue('onoff'));
        //   this.log("Current On/Off:"+ this.getCapabilityValue('onoff'));
        //   if (this.getCapabilityValue('dim') !== level)
        try {
            await this.setCapabilityValue('onoff', (value === 0) ? false : true);
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
}
module.exports = AxisDevice;
