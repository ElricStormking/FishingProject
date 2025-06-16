import { gameDataLoader } from '../scripts/DataLoader.js';
import { UITheme } from './UITheme.js';

export class FishTuningTool {
    constructor(scene, playerController) {
        this.scene = scene;
        this.playerController = playerController;
        this.isVisible = false;
        this.container = null;
        this.selectedFish = null;
        
            }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        if (this.isVisible) return;
        
        console.log('FishTuningTool: Showing tool');
        this.isVisible = true;
        this.createUI();
        
        // Listen for test completion
        this.scene.events.on('tuningTestEnded', this.onTestEnded, this);
    }
    
    hide() {
        if (!this.isVisible) return;
        
        console.log('FishTuningTool: Hiding tool');
        this.isVisible = false;
        
        // Clean up event listeners
        this.scene.events.off('tuningTestEnded', this.onTestEnded, this);
        
        // Remove UI
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
    
    createUI() {
        // Create overlay background
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Create main container
        const container = document.createElement('div');
        container.style.cssText = `
            background: ${UITheme.colors.background};
            border: 2px solid ${UITheme.colors.accent};
            border-radius: 8px;
            padding: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
            color: ${UITheme.colors.text};
            font-family: ${UITheme.fonts.primary};
        `;
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Fish Tuning Tool';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: ${UITheme.colors.accent};
            text-align: center;
            font-size: 24px;
        `;
        
        // Instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Select a fish species to test its AI behavior and reeling difficulty. Press "U" to exit.';
        instructions.style.cssText = `
            margin: 0 0 20px 0;
            color: ${UITheme.colors.textSecondary};
            text-align: center;
            font-size: 14px;
        `;
        
        // Fish selection dropdown
        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Select Fish Species:';
        selectLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: ${UITheme.colors.text};
        `;
        
        const fishSelect = document.createElement('select');
        fishSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 20px;
            background: ${UITheme.colors.inputBackground};
            border: 1px solid ${UITheme.colors.border};
            border-radius: 4px;
            color: #4A90E2;
            font-size: 14px;
        `;
        
        // Populate fish dropdown
        const allFish = gameDataLoader.getAllFish();
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select a fish --';
        fishSelect.appendChild(defaultOption);
        
        // Add fish options
        allFish.forEach(fish => {
            const option = document.createElement('option');
            option.value = fish.id;
            option.textContent = `${fish.name} (Rarity: ${fish.rarity})`;
            fishSelect.appendChild(option);
        });
        
        // Fish details container
        const detailsContainer = document.createElement('div');
        detailsContainer.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            display: none;
        `;
        
        // Start test button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Test';
        startButton.disabled = true;
        startButton.style.cssText = `
            width: 100%;
            padding: 12px;
            background: ${UITheme.colors.accent};
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0.5;
        `;
        
        // Fish selection handler
        fishSelect.addEventListener('change', (e) => {
            const fishId = e.target.value;
            if (fishId) {
                this.selectedFish = gameDataLoader.getFishById(fishId);
                this.updateFishDetails(detailsContainer, this.selectedFish);
                detailsContainer.style.display = 'block';
                startButton.disabled = false;
                startButton.style.opacity = '1';
                startButton.style.cursor = 'pointer';
            } else {
                this.selectedFish = null;
                detailsContainer.style.display = 'none';
                startButton.disabled = true;
                startButton.style.opacity = '0.5';
                startButton.style.cursor = 'not-allowed';
            }
        });
        
        // Start test button handler
        startButton.addEventListener('click', () => {
            if (this.selectedFish) {
                this.startTest();
            }
        });
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close (U)';
        closeButton.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: transparent;
            border: 1px solid ${UITheme.colors.border};
            border-radius: 4px;
            color: ${UITheme.colors.text};
            cursor: pointer;
        `;
        
        closeButton.addEventListener('click', () => {
            this.hide();
        });
        
        // Assemble UI
        container.appendChild(title);
        container.appendChild(instructions);
        container.appendChild(selectLabel);
        container.appendChild(fishSelect);
        container.appendChild(detailsContainer);
        container.appendChild(startButton);
        container.appendChild(closeButton);
        
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        this.container = overlay;
        
        // Handle escape key
        this.keyHandler = (e) => {
            if (e.key === 'u' || e.key === 'U' || e.key === 'Escape') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }
    
    updateFishDetails(container, fish) {
        container.innerHTML = '';
        
        // Fish basic info
        const basicInfo = document.createElement('div');
        basicInfo.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: ${UITheme.colors.accent};">${fish.name}</h3>
            <p style="margin: 5px 0;"><strong>Rarity:</strong> ${fish.rarity}/10</p>
            <p style="margin: 5px 0;"><strong>Size:</strong> ${fish.size || 'Medium'}</p>
            <p style="margin: 5px 0;"><strong>Weight:</strong> ${fish.weight || 'Unknown'}kg</p>
            <p style="margin: 5px 0;"><strong>Habitat:</strong> ${fish.habitat || 'Various'}</p>
        `;
        
        // Fish attributes
        const attributes = document.createElement('div');
        attributes.style.marginTop = '15px';
        
        const attributesList = [
            'aggression', 'speed', 'stamina', 'intelligence', 
            'unpredictability', 'strength', 'endurance'
        ];
        
        let attributesHTML = '<h4 style="margin: 0 0 10px 0; color: ' + UITheme.colors.accent + ';">Fish Attributes:</h4>';
        attributesList.forEach(attr => {
            const value = fish[attr] || 5;
            attributesHTML += `<p style="margin: 3px 0;"><strong>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</strong> ${value}/10</p>`;
        });
        
        attributes.innerHTML = attributesHTML;
        
        // Struggle style and AI behavior
        const struggleStyle = gameDataLoader.getStruggleStyle(fish.struggleStyle || 'balanced');
        const aiInfo = document.createElement('div');
        aiInfo.style.marginTop = '15px';
        aiInfo.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: ${UITheme.colors.accent};">AI Behavior:</h4>
            <p style="margin: 5px 0;"><strong>Struggle Style:</strong> ${fish.struggleStyle || 'balanced'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${struggleStyle?.description || 'Standard fish behavior'}</p>
        `;
        
        // AI struggle breakdown
        const aiBreakdown = document.createElement('div');
        aiBreakdown.style.marginTop = '10px';
        aiBreakdown.innerHTML = `
            <h5 style="margin: 0 0 8px 0; color: ${UITheme.colors.textSecondary};">Struggle Types (10% each):</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
                <div>• Dash (QTE: Tap)</div>
                <div>• Thrash (QTE: Sequence)</div>
                <div>• Dive (QTE: Hold)</div>
                <div>• Surface (QTE: Timing)</div>
                <div>• Circle (QTE: Tap)</div>
                <div>• Zigzag (QTE: Sequence)</div>
                <div>• Spiral (QTE: Hold)</div>
                <div>• Jump (QTE: Timing)</div>
                <div>• Tire (QTE: Tap)</div>
                <div>• Panic (QTE: Sequence)</div>
            </div>
        `;
        
        container.appendChild(basicInfo);
        container.appendChild(attributes);
        container.appendChild(aiInfo);
        container.appendChild(aiBreakdown);
    }
    
    startTest() {
        if (!this.selectedFish) {
            console.warn('FishTuningTool: No fish selected for test');
            return;
        }
        
        console.log('FishTuningTool: Starting test with fish:', this.selectedFish.name);
        
        // Start the casting test which will lead to reeling
        this.playerController.startCastingTest(this.selectedFish);
        
        // Hide the tool during test but keep it ready to reappear
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    onTestEnded() {
        console.log('FishTuningTool: Test ended, showing tool again');
        
        // Show the tool again after test completion
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }
    
    destroy() {
        this.hide();
        
        // Remove key handler
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        
        console.log('FishTuningTool: Destroyed');
    }
} 