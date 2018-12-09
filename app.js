'use strict';

const Homey = require('homey');
class AxisApp extends Homey.App {

    onInit() {
        this.log(` AxisApp is running! `);
    }

}

module.exports = AxisApp;