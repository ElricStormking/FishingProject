import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import BoatMenuScene from './scenes/BoatMenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import ShopScene from './scenes/ShopScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import DialogScene from './scenes/DialogScene.js';
import QuestScene from './scenes/QuestScene.js';
import CabinScene from './scenes/CabinScene.js';
import AlbumScene from './scenes/AlbumScene.js';

// Initialize Stagewise toolbar in development mode only
if (import.meta.env.DEV) {
    import('@stagewise/toolbar').then(({ initToolbar }) => {
        const stagewiseConfig = {
            plugins: []
        };
        initToolbar(stagewiseConfig);
    }).catch(err => {
        console.warn('Stagewise toolbar failed to load:', err);
    });
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#003366',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        PreloadScene,
        MenuScene,
        BoatMenuScene,
        GameScene,
        HUDScene,
        ShopScene,
        SettingsScene,
        DialogScene,
        QuestScene,
        CabinScene,
        AlbumScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

export default game; 