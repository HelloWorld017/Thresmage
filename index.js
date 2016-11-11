'use strict';
const path = require('path');
module.paths.push(path.resolve('node_modules'));
module.paths.push(path.resolve('../node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', 'electron', 'node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', 'electron.asar', 'node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', 'app', 'node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', 'app.asar', 'node_modules'));

const {app, BrowserWindow} = require('electron');

let mainWindow;

let createMainWindow = () => {
	const win = new BrowserWindow({
		width: 1280,
		height: 1000,
		webPreferences: {
			nodeIntegration: false
		}
	});
	
	win.setMenu(null);
	win.loadURL(path.join(__dirname, 'app', 'index.html'));
	win.on('closed', () => {
		app.quit();
		mainWindow = undefined;
	});

	return win;
};

app.on('activate', () => {
	if(!mainWindow) mainWindow = createMainWindow();
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});

