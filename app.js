"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Homey = require("homey");
class AxisApp extends Homey.App {
    onInit() {
        this.log(` AxisApp is running! `);
    }
}
module.exports = AxisApp;
