import UITheme from './UITheme.js';

export class BaseUI {
    constructor(scene, x, y, width, height, title) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.title = title;

        this.gameState = scene.gameState;
        this.audioManager = this.gameState.getAudioManager(scene);
        
        this.isVisible = false;
        this.isDestroyed = false;

        this.container = null;
        this.background = null;
        this.clickBlocker = null;

        this._createContainer();
        this._createBlocker();
        this._createPanel();
        this._createTitle();
        this._createCloseButton();
    }

    _createContainer() {
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setDepth(10000);
    }

    _createBlocker() {
        this.clickBlocker = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.5
        ).setInteractive().setDepth(9999);
        
        this.clickBlocker.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.hide();
        });
    }

    _createPanel() {
        this.background = UITheme.createPanel(this.scene, 0, 0, this.width, this.height, 'primary');
        this.background.setInteractive(); // To catch clicks and prevent passthrough
        this.container.add(this.background);
    }
    
    _createTitle() {
        const title = UITheme.createText(this.scene, this.width / 2, 30, this.title, 'headerLarge');
        title.setOrigin(0.5);
        this.container.add(title);
    }

    _createCloseButton() {
        const closeButton = UITheme.createText(this.scene, this.width - 30, 30, '×', 'error');
        closeButton.setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeButton.setFontSize('32px');
        
        closeButton.on('pointerdown', () => this.hide());
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        
        this.container.add(closeButton);
    }

    createButton(x, y, width, height, text, onClick, style = 'primary') {
        return UITheme.createButton(this.scene, x, y, width, height, text, onClick, style);
    }

    show() {
        if (this.isVisible || this.isDestroyed) return;
        this.isVisible = true;
        this.container.setVisible(true);
        this.clickBlocker.setVisible(true);
        this.audioManager?.playSFX('button');
    }

    hide() {
        if (!this.isVisible || this.isDestroyed) return;
        this.isVisible = false;
        this.container.setVisible(false);
        this.clickBlocker.setVisible(false);
        this.audioManager?.playSFX('button');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        if (this.clickBlocker) {
            this.clickBlocker.destroy();
            this.clickBlocker = null;
        }
    }
} 