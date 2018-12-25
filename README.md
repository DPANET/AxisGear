# Axis Gear

### This app requires Homey SW release 1.5.7 or higher

This app adds support for the Zigbee Smart Home devices made by [Axis Gear](https://www.helloaxis.com/).  

Note: as of current firmware, Battery reporting is different when connected to AD/DC power, full battery will be reported @ 33%. 

## Supported Languages:
* English

## Change Log:
### v 1.0.1
* Fixed battery reporting, AC/DC will be reported at full 33%, in case of solar 100%.
### v 1.0.0
* Add support for Axis Gear (onoff,dim,measure_battery)