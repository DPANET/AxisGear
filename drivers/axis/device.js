'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;
const maxMoveLevel = 255;
const minMoveLevel = 0;
class AxisDevice extends ZigBeeDevice {

    onMeshInit() {
        // enable debugging
       // this.enableDebug();
       // this.printNode();
        // this.log('Zigbee Added');

        //map onoff
        try {
            this.registerCapability('onoff', 'genOnOff', {
                set: value => value ? 'on' : 'off',
                setParser: () => ({}),
                get: 'onOff',
                reportParser: value => value === 1
            })


            this.registerCapability('measure_battery', 'genPowerCfg',
                {
                    get: 'batteryPercentageRemaining',
                    report: 'batteryPercentageRemaining',
                    reportParser : value => Math.round(value/2)

                });

            //map dim        
            this.registerCapability('dim', 'genLevelCtrl',
                {
                    get: 'currentLevel',
                    report: 'currentLevel',
                    set: 'moveToLevel',
                    getOpts:
                    {
                        getOnStart: true,
                        getOnOnline: true,
                    },
                    setParser: value => (
                        {
                            level: value * maxMoveLevel,
                            transtime: this.getSetting('transtime')
                        }
                    ),

                    reportParser: value => (value / maxMoveLevel)
                });
        } catch (err) {
            this.error('failed to register mapping registerCapability ', err);
        }
        this.registerAttrReportListener(
            'genLevelCtrl', // Cluster
            'currentLevel', // Attr
            1, // Min report interval in seconds (must be greater than 1)
            3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
            0, // Report change value, if value changed more than this value send a report
            this.onControlLevelChangeReport.bind(this)) // Callback with value
            .then(() => {
                // Registering attr reporting succeeded
                this.log('registered attr report listener');
            })
            .catch(err => {
                // Registering attr reporting failed
                this.error('failed to register attr report listener', err);
            });

        if (this.hasCapability('measure_battery')) {
            this.registerAttrReportListener(
                'genPowerCfg', // Cluster
                'batteryPercentageRemaining', // Attr
                1, // Min report interval in seconds (must be greater than 1)
                3600, // Max report interval in seconds (must be zero or greater than 60 and greater than min report interval)
                0, // Report change value, if value changed more than this value send a report
                this.onPowerCfgBatteryPercentageRemainingReport.bind(this)) // Callback with value
                .then(() => {
                    // Registering attr reporting succeeded
                    this.log('registered attr report listener');
                })
                .catch(err => {
                    // Registering attr reporting failed
                    this.error('failed to register attr report listener', err);
                });
        }

    }

    onControlLevelChangeReport(value) {
        //this.log(value);
        if (this.getCapabilityValue('dim') != (value / maxMoveLevel))
            this.setCapabilityValue('dim', value / maxMoveLevel)
                .then(() => { })
                .catch(err => {
                    // Registering attr reporting failed
                    this.error('failed to set dim setCapabilityValue', err);
                });

        // update onOff capability
        if (this.getCapabilityValue('onoff') !== (value / maxMoveLevel) > 0) {
            this.setCapabilityValue('onoff', (value / maxMoveLevel) > 0)
                .then(() => { })
                .catch(err => {
                    // Registering attr reporting failed
                    this.error('failed to set on/off setCapabilityValue', err);
                });
        }
    }
    onPowerCfgBatteryPercentageRemainingReport(value) {
        let batteryValue = Math.round(value/2);
        //this.log('onPowerCfgBatteryPercentageRemainingReport ',batteryValue );
        this.setCapabilityValue('measure_battery', batteryValue)
            .then(() => { })
            .catch(err => {
                // Registering attr reporting failed
                this.error('failed to set battery setCapabilityValue', err);
            });



    }

}



module.exports = AxisDevice;
