'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Homey = require("homey");
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;
const maxMoveLevel = 254;
const minMoveLevel = 0;
class AxisDevice extends ZigBeeDevice {
    async onMeshInit() {
        // enable debugging
        this.enableDebug();
        //  this.printNode();
        // this.log('Zigbee Added');
        //map onoff capability
        try {
            // this.registerCapability('onoff', 'genOnOff', {
            //     set: value => value ? 'on' : 'off',
            //     setParser: () => ({}),
            //     get: 'onOff',
            //     getOpts:{
            //         getOnStart:true,
            //         getOnOnline:true
            //     },
            //     reportParser: value => value === 1
            // })
            // this.registerCapability('onoff', 'genOnOff');
            this.registerCapability('onoff', 'genLevelCtrl', {
                get: 'currentLevel',
                // report: 'currentLevel',
                set: 'moveToLevel',
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                },
                setParser: (value) => ({
                    level: value * maxMoveLevel,
                    transtime: this.getSetting('transtime')
                }),
                reportParser: (value) => value / maxMoveLevel
            });
            //map battery capability        
            this.registerCapability('measure_battery', 'genPowerCfg', {
                get: 'batteryPercentageRemaining',
                report: 'batteryPercentageRemaining',
                reportParser: (value) => Math.round(value / 2),
                endpoint: 0
            });
            //map dim capability        
            this.registerCapability('dim', 'genLevelCtrl', {
                get: 'currentLevel',
                // report: 'currentLevel',
                set: 'moveToLevel',
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                },
                setParser: (value) => ({
                    level: value * maxMoveLevel,
                    transtime: this.getSetting('transtime')
                }),
                reportParser: (value) => (value / maxMoveLevel)
            });
        }
        catch (err) {
            this.error('failed to register mapping registerCapability ', err);
        }
        this.registerAttrReportListener('genLevelCtrl', // Cluster
        'currentLevel', // Attr
        1, // Min report interval in seconds (must be greater than 1)
        3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
        0, // Report change value, if value changed more than this value send a report
        this.onControlLevelChangeReport.bind(this)) // Callback with value
            .then(() => {
            // Registering attr reporting succeeded
            this.log('registered attr report listener');
        })
            .catch((err) => {
            // Registering attr reporting failed
            this.error('failed to register attr report listener', err);
        });
        if (this.hasCapability('measure_battery')) {
            this.registerAttrReportListener('genPowerCfg', // Cluster
            'batteryPercentageRemaining', // Attr
            1, // Min report interval in seconds (must be greater than 1)
            3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
            0, // Report change value, if value changed more than this value send a report
            this.onPowerCfgBatteryPercentageRemainingReport.bind(this), 0) // Callback with value
                .then(() => {
                // Registering attr reporting succeeded
                this.log('registered attr report listener');
            })
                .catch((err) => {
                // Registering attr reporting failed
                this.error('failed to register attr report listener', err);
            });
        }
        //initialize Homey Events
        // Register toggle curtain flow card
        this.initEvents();
    }
    initEvents() {
        let toggleBlindAction = new Homey.FlowCardAction('toggle_blind_action');
        toggleBlindAction
            .register()
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
    async OnPowerChangeReport(value) {
        this.log("Current On/Off:" + this.getCapabilityValue('onoff'));
        try {
            await this.setCapabilityValue('onoff', value);
        }
        catch (err) {
            this.error('failed to set Onoff setCapabilityValue', err);
        }
    }
    async onControlLevelChangeReport(value) {
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
    onPowerCfgBatteryPercentageRemainingReport(value) {
        let batteryValue = Math.round(value / 2);
        this.log('onPowerCfgBatteryPercentageRemainingReport ', batteryValue);
        this.setCapabilityValue('measure_battery', batteryValue)
            .then(() => { })
            .catch((err) => {
            // Registering attr reporting failed
            this.error('failed to set battery setCapabilityValue', err);
        });
    }
    toggleBlind(device) {
        let state = !device.getCapabilityValue('onoff');
        // this.log(state);
        let result = true;
        return new Promise((resolve, reject) => {
            device.node.endpoints[0].clusters['genOnOff'].do('toggle', {})
                .then(() => {
                this.setCapabilityValue('onoff', state)
                    .then(() => {
                    // this.log('success set capablities');
                    resolve(result);
                })
                    .catch((err) => {
                    this.error('failed to toggle ', err);
                    resolve(!result);
                });
            })
                .catch((err) => {
                this.error('failed to set on/off setCapabilityValue based on action', err);
                resolve(!result);
            });
        });
    }
}
module.exports = AxisDevice;
