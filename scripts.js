// ===== ENHANCED SYSTEMS MODULES =====

// ===== EMOTION SYSTEM =====
const EmotionSystem = (() => {
    const emotions = {
        joy: { emoji: '😊', color: 'var(--joy)', intensity: 0, modifiers: { mood: 1.2, response: 1.3 } },
        anger: { emoji: '😠', color: 'var(--anger)', intensity: 0, modifiers: { mood: 0.8, response: 0.7 } },
        trust: { emoji: '🤝', color: 'var(--trust)', intensity: 0, modifiers: { mood: 1.1, response: 1.2 } },
        anticipation: { emoji: '🤔', color: 'var(--anticipation)', intensity: 0, modifiers: { mood: 1.0, response: 1.1 } },
        sadness: { emoji: '😢', color: 'var(--sadness)', intensity: 0, modifiers: { mood: 0.9, response: 0.9 } },
        disgust: { emoji: '🤢', color: 'var(--disgust)', intensity: 0, modifiers: { mood: 0.7, response: 0.8 } },
        fear: { emoji: '😨', color: 'var(--fear)', intensity: 0, modifiers: { mood: 0.8, response: 0.9 } },
        surprise: { emoji: '😲', color: 'var(--surprise)', intensity: 0, modifiers: { mood: 1.0, response: 1.1 } }
    };

    const emotionMemory = new Map();

    const getEmotion = (npcName) => {
        if (!emotionMemory.has(npcName)) {
            emotionMemory.set(npcName, { current: 'anticipation', intensity: 50 });
        }
        return emotionMemory.get(npcName);
    };

    const setEmotion = (npcName, emotion, intensity = 50) => {
        const currentEmotion = getEmotion(npcName);
        currentEmotion.current = emotion;
        currentEmotion.intensity = Math.max(0, Math.min(100, intensity));
        
        if (!currentEmotion.history) currentEmotion.history = [];
        currentEmotion.history.push({
            emotion,
            intensity,
            timestamp: Date.now(),
            location: IntegratedGameState.getState().currentLocation
        });
        
        if (currentEmotion.history.length > 10) {
            currentEmotion.history.shift();
        }
        
        emotionMemory.set(npcName, currentEmotion);
        updateEmotionDisplay(npcName);
    };

    const influenceEmotion = (npcName, emotion, amount) => {
        const current = getEmotion(npcName);
        if (current.current === emotion) {
            current.intensity = Math.max(0, Math.min(100, current.intensity + amount));
        } else {
            current.intensity = Math.max(0, Math.min(100, current.intensity - amount));
            if (current.intensity <= 30) {
                setEmotion(npcName, emotion, 50);
            }
        }
        emotionMemory.set(npcName, current);
        updateEmotionDisplay(npcName);
    };

    const getEmotionModifier = (npcName, type) => {
        const emotion = getEmotion(npcName);
        const modifiers = emotions[emotion.current]?.modifiers || { mood: 1.0, response: 1.0 };
        return modifiers[type] || 1.0;
    };

    const updateEmotionDisplay = (npcName) => {
        const emotion = getEmotion(npcName);
        const display = document.getElementById('npc-emotion-display');
        if (display && emotion && emotions[emotion.current]) {
            display.innerHTML = `${emotions[emotion.current].emoji} ${emotion.current} (${emotion.intensity})`;
            display.style.color = emotions[emotion.current].color;
        } else if (display) {
            display.innerHTML = '😐 neutral (50)';
            display.style.color = 'var(--text-secondary)';
        }
    };

    const refreshEmotionWheelForNPC = (npcName) => {
        const emotion = getEmotion(npcName);
        const segments = document.querySelectorAll('.emotion-segment');
        
        segments.forEach(segment => {
            segment.classList.remove('active');
            if (segment.dataset.emotion === emotion.current) {
                segment.classList.add('active');
            }
        });
        
        updateEmotionDisplay(npcName);
    };

    const getEmotionResponse = (npcName, dialogType) => {
        const responses = {
            joy: {
                compliment: ["You're making me smile!", "That's so sweet of you!", "I'm really happy right now!"],
                insult: ["That's not nice...", "Why would you say that?", "I was having such a good mood..."]
            },
            anger: {
                compliment: ["Save it.", "Too little too late.", "I'm not in the mood."],
                insult: ["How dare you!", "That's it, I'm done!", "You've crossed a line!"]
            },
            trust: {
                compliment: ["I feel I can really open up to you.", "You're so understanding.", "I trust you completely."],
                insult: ["I thought I could trust you...", "This really hurts coming from you.", "My trust was misplaced."]
            }
        };

        const emotion = getEmotion(npcName);
        const emotionResponses = responses[emotion.current]?.[dialogType] || ["I see.", "Interesting.", "Okay."];
        return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    };

    const initializeEmotionWheel = () => {
        const wheel = document.getElementById('emotion-wheel');
        const indicator = document.getElementById('emotion-indicator');
        
        if (!wheel || !indicator) return;

        const segments = wheel.querySelectorAll('.emotion-segment');
        segments.forEach(segment => {
            segment.addEventListener('click', () => {
                const emotion = segment.dataset.emotion;
                const state = IntegratedGameState.getState();
                const npcName = state.currentNPC;
                
                indicator.textContent = `Set ${npcName}'s emotion to ${emotion}`;
                indicator.style.display = 'block';
                indicator.style.background = emotions[emotion]?.color || 'var(--primary)';
                
                setEmotion(npcName, emotion, 60);
                
                IntegratedUIManager.addMessage(`Larry: *Tries to make ${npcName} feel ${emotion}*`, 'player');
                setTimeout(() => {
                    const response = getEmotionResponse(npcName, 'compliment');
                    IntegratedUIManager.addMessage(`${npcName}: ${response}`, 'npc');
                    
                    const npc = IntegratedGameState.getNPC(npcName);
                    if (npc) {
                        const moodChange = emotion === 'joy' ? 15 : emotion === 'anger' ? -10 : 5;
                        IntegratedGameState.updateNPC(npcName, {
                            baseMood: Math.max(0, Math.min(100, npc.baseMood + moodChange))
                        });
                    }
                    
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 2000);
                }, 500);
                
                segments.forEach(s => s.classList.remove('active'));
                segment.classList.add('active');
            });
        });

        const toggleBtn = document.getElementById('emotion-wheel-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                wheel.style.display = wheel.style.display === 'none' ? 'flex' : 'none';
            });
        }
    };

    return {
        getEmotion,
        setEmotion,
        influenceEmotion,
        getEmotionModifier,
        getEmotionResponse,
        initializeEmotionWheel,
        updateEmotionDisplay,
        refreshEmotionWheelForNPC
    };
})();

// ===== STORY ENGINE =====
const StoryEngine = (() => {
    const storyBranches = {
        Eve: [
            { level: 0, title: "First Meeting", description: "Meet Eve at the bar", unlocked: true },
            { level: 20, title: "Getting to Know", description: "Learn about Eve's past", unlocked: false },
            { level: 40, title: "Opening Up", description: "Eve shares her dreams", unlocked: false },
            { level: 60, title: "Deep Connection", description: "Share intimate moments", unlocked: false },
            { level: 80, title: "True Love", description: "Commit to each other", unlocked: false }
        ],
        Jessica: [
            { level: 0, title: "The Flirt", description: "Meet Jessica at the bar", unlocked: true },
            { level: 25, title: "Dance Partner", description: "Dance with Jessica", unlocked: false },
            { level: 50, title: "Night Out", description: "Experience the nightlife together", unlocked: false },
            { level: 75, title: "Unexpected Feelings", description: "Develop deeper connection", unlocked: false }
        ],
        Danielle: [
            { level: 0, title: "The Receptionist", description: "Meet Danielle at the hotel", unlocked: true },
            { level: 30, title: "Hotel Secrets", description: "Learn hotel secrets", unlocked: false },
            { level: 60, title: "Romantic Evening", description: "Spend evening together", unlocked: false }
        ],
        Ashley: [
            { level: 0, title: "Beach Encounter", description: "Meet Ashley at the beach", unlocked: true },
            { level: 35, title: "Surf Lessons", description: "Learn to surf together", unlocked: false },
            { level: 70, title: "Sunset Romance", description: "Watch sunset together", unlocked: false }
        ],
        Nicole: [
            { level: 0, title: "Casino Queen", description: "Meet Nicole at the casino", unlocked: true },
            { level: 40, title: "High Stakes", description: "Play high stakes games", unlocked: false },
            { level: 80, title: "Mystery Solved", description: "Learn Nicole's secret", unlocked: false }
        ]
    };

    const checkStoryProgress = (npcName, relationshipLevel) => {
        const branches = storyBranches[npcName] || [];
        const unlockedBranches = branches.filter(branch => relationshipLevel >= branch.level);
        
        unlockedBranches.forEach(branch => {
            if (!branch.unlocked) {
                branch.unlocked = true;
                IntegratedUIManager.showNotification(`📖 New Story Branch Unlocked: ${branch.title} with ${npcName}!`, 'success');
                
                IntegratedGameState.addComment({
                    npc: npcName,
                    text: `I feel like I can share more with you now...`,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: false
                });
                IntegratedUIManager.renderComments();
            }
        });
        
        return unlockedBranches;
    };

    const generateStoryDialog = (npcName, storyLevel) => {
        const stories = {
            Eve: {
                20: "You know, I wasn't always this confident. I used to be quite shy actually...",
                40: "Sometimes I wonder what I'm doing with my life. There has to be more than this, right?",
                60: "I've never told anyone this, but... I'm actually afraid of being alone.",
                80: "You make me feel things I haven't felt in a long time. Maybe we're meant to be..."
            },
            Jessica: {
                25: "I love dancing! It's like telling a story with your body, you know?",
                50: "The nightlife can be exhausting sometimes. It's nice to have someone real to talk to.",
                75: "You're different from the other guys here. You actually listen to me."
            },
            Danielle: {
                30: "Working at the hotel, you see all kinds of people. Some stories are quite romantic.",
                60: "There's a secret rooftop garden here. Not many people know about it..."
            },
            Ashley: {
                35: "Surfing taught me to go with the flow. You can't fight the waves, you know?",
                70: "Sunsets here are magical. They remind me that every ending can be beautiful."
            },
            Nicole: {
                40: "In poker, it's not about the cards you're dealt, but how you play them.",
                80: "I have a secret... this isn't my real name. But you can call me whatever you like."
            }
        };
        
        return stories[npcName]?.[storyLevel] || "I'm enjoying our conversation.";
    };

    const renderStoryProgress = () => {
        const container = document.getElementById('story-progress-content');
        if (!container) return;
        
        container.innerHTML = '';
        const npcs = IntegratedGameState.getNPCs();
        
        Object.keys(storyBranches).forEach(npcName => {
            const npc = npcs[npcName];
            if (npc && npc.relationship > 0) {
                const branches = storyBranches[npcName];
                const unlockedCount = branches.filter(b => b.unlocked).length;
                const totalBranches = branches.length;
                
                const storySection = document.createElement('div');
                storySection.className = 'story-progress';
                
                let storyHTML = `<h4>${npcName}'s Story (${unlockedCount}/${totalBranches})</h4>`;
                branches.forEach(branch => {
                    const status = branch.unlocked ? 'unlocked' : 'locked';
                    const icon = branch.unlocked ? '✅' : '🔒';
                    storyHTML += `
                        <div class="story-milestone ${status}">
                            <span>${icon}</span>
                            <div>
                                <strong>${branch.title}</strong><br>
                                <small>${branch.description} (Level ${branch.level})</small>
                            </div>
                        </div>
                    `;
                });
                
                storySection.innerHTML = storyHTML;
                container.appendChild(storySection);
            }
        });
        
        if (container.children.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary)">No story progress yet. Build relationships to unlock stories!</div>';
        }
    };

    return {
        checkStoryProgress,
        generateStoryDialog,
        renderStoryProgress
    };
})();

// ===== ACHIEVEMENT SYSTEM =====
const AchievementSystem = (() => {
    const achievements = {
        first_meeting: { id: 'first_meeting', name: 'First Contact', description: 'Talk to your first NPC', icon: '👋', unlocked: false },
        social_butterfly: { id: 'social_butterfly', name: 'Social Butterfly', description: 'Talk to all 5 main NPCs', icon: '🦋', unlocked: false },
        romantic: { id: 'romantic', name: 'Romantic', description: 'Reach relationship 50 with any NPC', icon: '💝', unlocked: false },
        player: { id: 'player', name: 'Player', description: 'Have 3 NPCs at relationship 30+', icon: '🎮', unlocked: false },
        collector: { id: 'collector', name: 'Collector', description: 'Collect 10 different items', icon: '🎒', unlocked: false },
        rich: { id: 'rich', name: 'Rich', description: 'Reach 1000 score', icon: '💰', unlocked: false },
        perfect_romance: { id: 'perfect_romance', name: 'Perfect Romance', description: 'Reach 100 relationship with any NPC', icon: '💖', unlocked: false },
        multi_dater: { id: 'multi_dater', name: 'Multi-Dater', description: 'Go on dates with 3 different NPCs', icon: '📅', unlocked: false },
        story_master: { id: 'story_master', name: 'Story Master', description: 'Unlock all story branches for one NPC', icon: '📖', unlocked: false },
        emotion_master: { id: 'emotion_master', name: 'Emotion Master', description: 'Experience all 8 emotions with NPCs', icon: '💭', unlocked: false }
    };

    const unlockedAchievements = new Set();

    const checkAchievement = (achievementId) => {
        const achievement = achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        const state = IntegratedGameState.getState();
        const npcs = IntegratedGameState.getNPCs();
        
        let shouldUnlock = false;
        
        switch(achievementId) {
            case 'first_meeting':
                shouldUnlock = Object.values(npcs).some(npc => npc.relationship > 0);
                break;
            case 'social_butterfly':
                const mainNPCs = ['Eve', 'Jessica', 'Danielle', 'Ashley', 'Nicole'];
                shouldUnlock = mainNPCs.every(name => npcs[name]?.relationship > 0);
                break;
            case 'romantic':
                shouldUnlock = Object.values(npcs).some(npc => npc.relationship >= 50);
                break;
            case 'player':
                shouldUnlock = Object.values(npcs).filter(npc => npc.relationship >= 30).length >= 3;
                break;
            case 'collector':
                shouldUnlock = state.inventory.length >= 10;
                break;
            case 'rich':
                shouldUnlock = state.score >= 1000;
                break;
            case 'perfect_romance':
                shouldUnlock = Object.values(npcs).some(npc => npc.relationship >= 100);
                break;
            case 'multi_dater':
                shouldUnlock = state.scheduledDates.filter(date => date.completed).length >= 3;
                break;
            case 'story_master':
                shouldUnlock = Object.values(npcs).some(npc => npc.relationship >= 80);
                break;
            case 'emotion_master':
                shouldUnlock = state.enhancedMode && state.score > 500;
                break;
        }

        if (shouldUnlock) {
            unlockAchievement(achievementId);
        }
    };

    const unlockAchievement = (achievementId) => {
        const achievement = achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        unlockedAchievements.add(achievementId);
        
        IntegratedUIManager.showNotification(`🏆 Achievement Unlocked: ${achievement.name}! +100 points`, 'success');
        IntegratedGameState.setState({ score: IntegratedGameState.getState().score + 100 });
        
        renderAchievements();
    };

    const renderAchievements = () => {
        const container = document.getElementById('achievements-grid');
        if (!container) return;
        
        container.innerHTML = '';
        Object.values(achievements).forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementEl.title = `${achievement.name}: ${achievement.description}`;
            
            achievementEl.innerHTML = `
                <div style="font-size: 2rem;">${achievement.icon}</div>
                <div style="font-size: 0.7rem; margin-top: 5px;">${achievement.name}</div>
            `;
            
            container.appendChild(achievementEl);
        });
    };

    const checkAllAchievements = () => {
        Object.keys(achievements).forEach(checkAchievement);
    };

    return {
        checkAchievement,
        unlockAchievement,
        renderAchievements,
        checkAllAchievements
    };
})();

// ===== ANALYTICS DASHBOARD =====
const AnalyticsSystem = (() => {
    const relationshipHistory = new Map();
    
    const recordRelationshipChange = (npcName, oldValue, newValue) => {
        if (!relationshipHistory.has(npcName)) {
            relationshipHistory.set(npcName, []);
        }
        
        const history = relationshipHistory.get(npcName);
        history.push({
            value: newValue,
            timestamp: Date.now(),
            location: IntegratedGameState.getState().currentLocation
        });
        
        if (history.length > 20) {
            history.shift();
        }
    };
    
    const renderRelationshipGraph = () => {
        const container = document.getElementById('relationship-graph');
        if (!container) return;
        
        container.innerHTML = '';
        const npcs = IntegratedGameState.getNPCs();
        const activeNPCs = Object.values(npcs).filter(npc => npc.relationship > 0);
        
        if (activeNPCs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary)">No relationship data yet. Start talking to NPCs!</div>';
            return;
        }
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        activeNPCs.forEach((npc, npcIndex) => {
            const lineContainer = document.createElement('div');
            lineContainer.style.position = 'absolute';
            lineContainer.style.width = '100%';
            lineContainer.style.height = '100%';
            container.appendChild(lineContainer);
            
            const history = relationshipHistory.get(npc.name) || [{ value: npc.relationship }];
            const points = history.map((h, i) => ({
                x: (i / (history.length - 1 || 1)) * width,
                y: height - (h.value / 100) * height
            }));
            
            for (let i = 1; i < points.length; i++) {
                const line = document.createElement('div');
                line.className = 'graph-line';
                line.style.position = 'absolute';
                line.style.left = `${points[i-1].x}px`;
                line.style.top = `${points[i-1].y}px`;
                line.style.width = `${Math.sqrt(Math.pow(points[i].x - points[i-1].x, 2) + Math.pow(points[i].y - points[i-1].y, 2))}px`;
                line.style.height = '2px';
                line.style.background = npc.color || 'var(--primary)';
                line.style.transformOrigin = '0 0';
                line.style.transform = `rotate(${Math.atan2(points[i].y - points[i-1].y, points[i].x - points[i-1].x)}rad)`;
                lineContainer.appendChild(line);
            }
        });
    };
    
    const getAnalyticsData = () => {
        const npcs = IntegratedGameState.getNPCs();
        const data = {
            totalInteractions: IntegratedGameState.getMessages().length,
            npcRelationships: {},
            timePlayed: IntegratedGameState.getState().time,
            itemsCollected: IntegratedGameState.getState().inventory.length,
            questsCompleted: IntegratedGameState.getState().questsCompleted
        };
        
        Object.keys(npcs).forEach(npcName => {
            const npc = npcs[npcName];
            if (npc && npc.relationship > 0) {
                data.npcRelationships[npcName] = {
                    relationship: npc.relationship,
                    mood: npc.baseMood,
                    intimacy: npc.intimacy || 0
                };
            }
        });
        
        return data;
    };
    
    return {
        recordRelationshipChange,
        renderRelationshipGraph,
        getAnalyticsData
    };
})();

// ===== MINI-GAME SYSTEM =====
const MiniGameSystem = (() => {
    const games = {
        poker: {
            name: 'Poker',
            minBet: 50,
            maxBet: 500,
            setup: (container) => {
                container.innerHTML = `
                    <div class="poker-table" id="poker-table">
                        <div class="poker-card" data-card="1">🃏</div>
                        <div class="poker-card" data-card="2">🃏</div>
                        <div class="poker-card" data-card="3">🃏</div>
                        <div class="poker-card" data-card="4">🃏</div>
                        <div class="poker-card" data-card="5">🃏</div>
                    </div>
                    <div style="text-align: center; margin: 15px 0;">
                        <div>Your Score: <span id="poker-score">0</span></div>
                        <div>NPC Score: <span id="npc-poker-score">0</span></div>
                    </div>
                `;
            },
            play: () => {
                const cards = document.querySelectorAll('.poker-card');
                const playerScoreEl = document.getElementById('poker-score');
                const npcScoreEl = document.getElementById('npc-poker-score');
                
                cards.forEach(card => {
                    const suits = ['♠️', '♥️', '♦️', '♣️'];
                    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                    const suit = suits[Math.floor(Math.random() * suits.length)];
                    const value = values[Math.floor(Math.random() * values.length)];
                    
                    card.textContent = suit === '♥️' || suit === '♦️' ? `🟥${value}` : `⬛${value}`;
                    card.style.background = suit === '♥️' || suit === '♦️' ? '#ff6b6b' : '#2c3e50';
                    card.style.color = 'white';
                });
                
                const playerScore = Math.floor(Math.random() * 50) + 25;
                const npcScore = Math.floor(Math.random() * 50) + 20;
                
                playerScoreEl.textContent = playerScore;
                npcScoreEl.textContent = npcScore;
                
                setTimeout(() => {
                    const state = IntegratedGameState.getState();
                    if (playerScore > npcScore) {
                        const winnings = 100;
                        IntegratedGameState.setState({ score: state.score + winnings });
                        IntegratedUIManager.showNotification(`🎉 You won $${winnings} at poker!`, 'success');
                    } else {
                        const loss = 50;
                        if (state.score >= loss) {
                            IntegratedGameState.setState({ score: state.score - loss });
                            IntegratedUIManager.showNotification(`😔 Lost $${loss} at poker.`, 'warning');
                        }
                    }
                    IntegratedUIManager.updateStats();
                }, 1000);
            }
        }
    };
    
    const startMiniGame = (gameName) => {
        const game = games[gameName];
        if (!game) return;
        
        const panel = document.getElementById('mini-game-panel');
        if (!panel) return;
        
        const title = panel.querySelector('.panel-title') || panel.querySelector('h3');
        if (title) {
            title.textContent = game.name;
        }
        
        const content = panel.querySelector('#poker-table')?.parentElement || panel;
        game.setup(content);
        panel.style.display = 'block';
        
        const dealBtn = document.getElementById('deal-poker');
        const foldBtn = document.getElementById('fold-poker');
        const betBtn = document.getElementById('bet-poker');
        const closeBtn = document.getElementById('close-mini-game');
        
        if (dealBtn) dealBtn.onclick = () => game.play();
        if (foldBtn) foldBtn.onclick = () => {
            IntegratedUIManager.showNotification('Folded! Better luck next time.', 'warning');
            panel.style.display = 'none';
        };
        if (betBtn) betBtn.onclick = () => {
            const state = IntegratedGameState.getState();
            if (state.score >= 50) {
                IntegratedGameState.setState({ score: state.score - 50 });
                game.play();
                IntegratedUIManager.updateStats();
            } else {
                IntegratedUIManager.showNotification('Not enough money to bet!', 'error');
            }
        };
        if (closeBtn) closeBtn.onclick = () => {
            panel.style.display = 'none';
        };
    };
    
    return {
        startMiniGame
    };
})();

// ===== INTEGRATED GAME STATE (Enhanced) =====
const IntegratedGameState = (() => {
    let state = {
        ageVerified: false,
        adultMode: false,
        score: 250,
        time: 765,
        relationship: 15,
        mood: 50,
        intimacy: 0,
        progress: 0,
        currentLocation: 'bar',
        currentQuest: 0,
        questsCompleted: 0,
        inventory: ['money', 'phone', 'carKeys', 'sunglasses'],
        selectedItem: null,
        aiMode: true,
        enhancedMode: false,
        currentNPC: 'Eve',
        activeDate: null,
        scheduledDates: [],
        unlockedEndings: [],
        jealousyLevel: 0,
        collectedItems: {},
        respawnTimers: {},
        condomCount: 3,
        lastCondomRestock: 0,
        condomRestockTimer: null,
        canRestockCondoms: true
    };

    const locations = [
        { 
            id: 'bar', 
            name: 'Le Bar de l\'Amour', 
            items: ['briefcase', 'drink', 'key', 'wine', 'napkin'],
            npcs: ['Eve', 'Jessica', 'Bartender'],
            adultAvailable: true,
            dateAvailable: true,
            dateBackground: 'linear-gradient(135deg, #2c3e50, #34495e)',
            respawnItems: ['drink', 'wine'],
            respawnTime: 30000,
            canBuyCondoms: true,
            condomPrice: 50
        },
        { 
            id: 'hotel', 
            name: 'Hotel Lobby', 
            items: ['flowers', 'perfume', 'roomKey', 'champagne'],
            npcs: ['Danielle', 'Receptionist', 'Maid'],
            adultAvailable: true,
            dateAvailable: true,
            dateBackground: 'linear-gradient(135deg, #3498db, #2980b9)',
            respawnItems: [],
            respawnTime: 60000,
            canBuyCondoms: true,
            condomPrice: 50
        },
        { 
            id: 'beach', 
            name: 'Sunset Beach', 
            items: ['shell', 'towel', 'sunscreen', 'cocktail'],
            npcs: ['Ashley', 'Lifeguard', 'BikiniGirl'],
            adultAvailable: false,
            dateAvailable: true,
            dateBackground: 'linear-gradient(135deg, #f1c40f, #f39c12)',
            respawnItems: ['cocktail'],
            respawnTime: 30000,
            canBuyCondoms: false,
            condomPrice: 0
        },
        { 
            id: 'casino', 
            name: 'Golden Casino', 
            items: ['chips', 'dice', 'cigar', 'whiskey'],
            npcs: ['Nicole', 'Dealer', 'RichMan'],
            adultAvailable: true,
            dateAvailable: true,
            dateBackground: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            respawnItems: ['whiskey', 'cigar'],
            respawnTime: 30000,
            canBuyCondoms: true,
            condomPrice: 50
        },
        { 
            id: 'hotelRoom', 
            name: 'Hotel Suite', 
            items: ['robe', 'candle', 'chocolate', 'lube'],
            npcs: ['Eve'],
            adultAvailable: true,
            locked: true,
            dateAvailable: false,
            dateBackground: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
            respawnItems: [],
            respawnTime: 0,
            canBuyCondoms: false,
            condomPrice: 0
        }
    ];

    const items = {
        briefcase: { emoji: '💼', name: 'Mystery Briefcase', adult: false, consumable: false },
        drink: { emoji: '🍸', name: 'Exotic Cocktail', adult: false, consumable: true },
        key: { emoji: '🔑', name: 'Golden Key', adult: false, consumable: false },
        money: { emoji: '💵', name: 'Cash', adult: false, consumable: false },
        phone: { emoji: '📱', name: 'Smartphone', adult: false, consumable: false },
        carKeys: { emoji: '🚗', name: 'Car Keys', adult: false, consumable: false },
        sunglasses: { emoji: '🕶️', name: 'Sunglasses', adult: false, consumable: false },
        flowers: { emoji: '💐', name: 'Flowers', adult: false, consumable: true },
        perfume: { emoji: '🧴', name: 'Perfume', adult: false, consumable: true },
        shell: { emoji: '🐚', name: 'Seashell', adult: false, consumable: false },
        towel: { emoji: '🏖️', name: 'Beach Towel', adult: false, consumable: false },
        chips: { emoji: '🪙', name: 'Poker Chips', adult: false, consumable: true },
        dice: { emoji: '🎲', name: 'Lucky Dice', adult: false, consumable: false },
        condom: { emoji: '💋', name: 'Protection', adult: true, consumable: true, restockable: true },
        wine: { emoji: '🍷', name: 'Romantic Wine', adult: true, consumable: true },
        roomKey: { emoji: '🏨', name: 'Room Key', adult: true, consumable: false },
        champagne: { emoji: '🍾', name: 'Champagne', adult: true, consumable: true },
        sunscreen: { emoji: '🧴', name: 'Sunscreen', adult: true, consumable: true },
        cigar: { emoji: '🚬', name: 'Cigar', adult: true, consumable: true },
        whiskey: { emoji: '🥃', name: 'Whiskey', adult: true, consumable: true },
        robe: { emoji: '👘', name: 'Silk Robe', adult: true, consumable: false },
        candle: { emoji: '🕯️', name: 'Scented Candle', adult: true, consumable: true },
        chocolate: { emoji: '🍫', name: 'Chocolate', adult: true, consumable: true },
        lube: { emoji: '💧', name: 'Massage Oil', adult: true, consumable: true },
        napkin: { emoji: '🧻', name: 'Napkin', adult: false, consumable: true },
        cocktail: { emoji: '🍹', name: 'Beach Cocktail', adult: true, consumable: true },
        ticket: { emoji: '🎫', name: 'Concert Ticket', adult: false, consumable: false }
    };

    const npcs = {
        Eve: {
            id: 'eve',
            name: 'Eve',
            emoji: '👩',
            color: 'var(--eve)',
            locations: ['bar', 'hotelRoom'],
            baseMood: 50,
            relationship: 15,
            intimacy: 0,
            adultTolerance: 7,
            personality: 'confident',
            storyProgress: 0,
            giftPreferences: ['wine', 'flowers', 'chocolate'],
            jealousyLevel: 0,
            quests: [
                { id: 'eve1', name: "Get Eve's Attention", completed: false, progress: 0 },
                { id: 'eve2', name: "Romantic Evening", completed: false, progress: 0 }
            ],
            endings: []
        },
        Jessica: {
            id: 'jessica',
            name: 'Jessica',
            emoji: '💃',
            color: 'var(--jessica)',
            locations: ['bar'],
            baseMood: 60,
            relationship: 0,
            intimacy: 0,
            adultTolerance: 6,
            personality: 'flirtatious',
            storyProgress: 0,
            giftPreferences: ['champagne', 'perfume', 'cigar'],
            jealousyLevel: 0,
            quests: [
                { id: 'jess1', name: "Meet Jessica", completed: false, progress: 0 }
            ],
            endings: []
        },
        Danielle: {
            id: 'danielle',
            name: 'Danielle',
            emoji: '👰',
            color: 'var(--danielle)',
            locations: ['hotel'],
            baseMood: 55,
            relationship: 0,
            intimacy: 0,
            adultTolerance: 7,
            personality: 'romantic',
            storyProgress: 0,
            giftPreferences: ['flowers', 'chocolate', 'candle'],
            jealousyLevel: 0,
            quests: [
                { id: 'dan1', name: "Help Danielle", completed: false, progress: 0 }
            ],
            endings: []
        },
        Ashley: {
            id: 'ashley',
            name: 'Ashley',
            emoji: '🏖️',
            color: 'var(--ashley)',
            locations: ['beach'],
            baseMood: 65,
            relationship: 0,
            intimacy: 0,
            adultTolerance: 8,
            personality: 'fun',
            storyProgress: 0,
            giftPreferences: ['sunscreen', 'cocktail', 'towel'],
            jealousyLevel: 0,
            quests: [
                { id: 'ash1', name: "Beach Fun", completed: false, progress: 0 }
            ],
            endings: []
        },
        Nicole: {
            id: 'nicole',
            name: 'Nicole',
            emoji: '🎰',
            color: 'var(--nicole)',
            locations: ['casino'],
            baseMood: 60,
            relationship: 0,
            intimacy: 0,
            adultTolerance: 7,
            personality: 'mysterious',
            storyProgress: 0,
            giftPreferences: ['whiskey', 'chips', 'dice'],
            jealousyLevel: 0,
            quests: [
                { id: 'nic1', name: "Win Nicole's Trust", completed: false, progress: 0 }
            ],
            endings: []
        },
        Bartender: { mood: 40, relationship: 5, adultTolerance: 8 },
        Receptionist: { mood: 30, relationship: 0, adultTolerance: 5 },
        Maid: { mood: 50, relationship: 0, adultTolerance: 6 },
        Lifeguard: { mood: 40, relationship: 0, adultTolerance: 4 },
        BikiniGirl: { mood: 70, relationship: 0, adultTolerance: 9 },
        Dealer: { mood: 45, relationship: 0, adultTolerance: 7 },
        RichMan: { mood: 30, relationship: 0, adultTolerance: 8 }
    };

    const quests = [
        { 
            id: 1, 
            name: "Get Eve's attention", 
            description: "Make Eve notice you by saying something interesting", 
            progress: 0, 
            completed: false, 
            reward: 100,
            objective: "Talk to Eve using interesting conversation options"
        },
        { 
            id: 2, 
            name: "Buy a drink", 
            description: "Get a drink for Eve to break the ice", 
            progress: 0, 
            completed: false, 
            reward: 150,
            objective: "Use the 'Offer a drink' dialog option"
        },
        { 
            id: 3, 
            name: "Find flowers", 
            description: "Get flowers to impress Eve", 
            progress: 0, 
            completed: false, 
            reward: 200,
            objective: "Collect flowers from the Hotel Lobby"
        },
        { 
            id: 4, 
            name: "Get perfume", 
            description: "Find Eve's favorite perfume", 
            progress: 0, 
            completed: false, 
            reward: 250,
            objective: "Collect perfume from the Hotel Lobby"
        },
        { 
            id: 5, 
            name: "Get a hotel room", 
            description: "Secure a room for the night", 
            progress: 0, 
            completed: false, 
            reward: 300, 
            adult: true,
            objective: "Collect the room key and build relationship to 70+"
        },
        { 
            id: 6, 
            name: "Romantic evening", 
            description: "Spend intimate time with Eve", 
            progress: 0, 
            completed: false, 
            reward: 500, 
            adult: true,
            objective: "Use adult items and flirt to increase intimacy"
        },
        { id: 7, name: "Meet All NPCs", description: "Encounter all romanceable NPCs", progress: 0, completed: false, reward: 200, enhanced: true },
        { id: 8, name: "Multiple Dates", description: "Go on dates with 3 different NPCs", progress: 0, completed: false, reward: 300, adult: true, enhanced: true },
        { id: 9, name: "True Love", description: "Reach 100 relationship with one NPC", progress: 0, completed: false, reward: 500, enhanced: true },
        { id: 10, name: "Player", description: "Reach 50+ relationship with 4 NPCs", progress: 0, completed: false, reward: 400, adult: true, enhanced: true },
        { id: 11, name: "Story Teller", description: "Unlock 3 story branches", progress: 0, completed: false, reward: 300, enhanced: true },
        { id: 12, name: "Emotion Master", description: "Experience 5 different emotions", progress: 0, completed: false, reward: 250, enhanced: true }
    ];

    const npcDialogs = {
        Eve: {
            greetings: [
                "Another night, another hopeful romantic. Make it interesting.",
                "You again? I'm starting to get used to seeing you.",
                "Well hello there. What's on your mind tonight?"
            ],
            compliments: [
                "Flattery will get you... well, maybe somewhere.",
                "You're not like the others. I'll give you that.",
                "That was actually quite charming!"
            ],
            storyHooks: [
                "You know, I wasn't always this confident...",
                "Sometimes I wonder what I'm doing here...",
                "Tell me something real about yourself."
            ]
        },
        Jessica: {
            greetings: [
                "Hey handsome! Come here often?",
                "Ooh, I like your style! Wanna dance?",
                "You look like you know how to have fun!"
            ],
            compliments: [
                "Smooth! I like a man who knows what he wants.",
                "You're making me blush!",
                "Keep talking like that and you might just get lucky!"
            ]
        },
        Danielle: {
            greetings: [
                "Hello... you seem different from the usual guests.",
                "It's a beautiful evening, isn't it?",
                "I love working here, there's always interesting people."
            ],
            compliments: [
                "That's very sweet of you to say.",
                "You have a kind way with words.",
                "Not many people notice the little things."
            ]
        },
        Ashley: {
            greetings: [
                "Hey! Enjoying the beach?",
                "Great day for some sun!",
                "You look like you could use some fun!"
            ],
            compliments: [
                "Aw, thanks! You're sweet!",
                "That's nice of you to say!",
                "You're making me smile!"
            ]
        },
        Nicole: {
            greetings: [
                "Interesting... I haven't seen you here before.",
                "Care to try your luck?",
                "You have an interesting aura about you."
            ],
            compliments: [
                "Interesting observation...",
                "You're quite perceptive.",
                "Not many people notice that."
            ]
        }
    };

    const npcComments = [];
    const messages = [];

    const getSelectedItem = () => state.selectedItem;
    const setSelectedItem = (itemId) => { state.selectedItem = itemId; };

    const getActiveRelationships = () => {
        const enhancedNPCs = ['Eve', 'Jessica', 'Danielle', 'Ashley', 'Nicole'];
        return enhancedNPCs
            .map(name => npcs[name])
            .filter(npc => npc && npc.relationship > 0)
            .sort((a, b) => b.relationship - a.relationship);
    };

    const getAvailableNPCs = () => {
        const currentLocation = locations.find(loc => loc.id === state.currentLocation);
        const enhancedNPCs = ['Eve', 'Jessica', 'Danielle', 'Ashley', 'Nicole'];
        return enhancedNPCs
            .map(name => npcs[name])
            .filter(npc => 
                npc && 
                currentLocation?.npcs.includes(npc.name) && 
                (state.adultMode || npc.adultTolerance >= 5)
            );
    };

    const updateJealousy = () => {
        if (!state.enhancedMode) return;
        
        const activeNPCs = getActiveRelationships();
        if (activeNPCs.length > 1) {
            state.jealousyLevel = Math.min(100, activeNPCs.length * 15);
            
            activeNPCs.forEach(npc => {
                if (npc.name !== state.currentNPC) {
                    npc.jealousyLevel = Math.min(100, (npc.jealousyLevel || 0) + 5);
                }
            });
        } else {
            state.jealousyLevel = 0;
        }
    };

    const scheduleDate = (npcName, locationId, time) => {
        state.scheduledDates.push({
            npc: npcName,
            location: locationId,
            time: time,
            completed: false
        });
        
        if (npcs[npcName]) {
            npcs[npcName].relationship += 10;
            state.relationship = npcs[npcName].relationship;
            
            AnalyticsSystem.recordRelationshipChange(npcName, npcs[npcName].relationship - 10, npcs[npcName].relationship);
        }
    };

    const unlockEnding = (npcName, endingType) => {
        const endingId = `${npcName}_${endingType}`;
        if (!state.unlockedEndings.includes(endingId)) {
            state.unlockedEndings.push(endingId);
            state.score += 1000;
            
            AchievementSystem.checkAchievement('perfect_romance');
            
            return true;
        }
        return false;
    };

    const markItemCollected = (locationId, itemId) => {
        const key = `${locationId}_${itemId}`;
        state.collectedItems[key] = Date.now();
        
        state.analytics = state.analytics || {};
        state.analytics.itemsCollected = (state.analytics.itemsCollected || 0) + 1;
        
        const location = locations.find(loc => loc.id === locationId);
        if (location && location.respawnItems.includes(itemId)) {
            const respawnTime = location.respawnTime || 30000;
            clearTimeout(state.respawnTimers[key]);
            
            state.respawnTimers[key] = setTimeout(() => {
                delete state.collectedItems[key];
                IntegratedUIManager.showNotification(`${items[itemId]?.name || 'Item'} has respawned!`);
                IntegratedSceneManager.renderScene();
            }, respawnTime);
        }
    };

    const isItemAvailable = (locationId, itemId) => {
        const key = `${locationId}_${itemId}`;
        return !state.collectedItems[key];
    };

    const getAvailableItems = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        if (!location) return [];
        
        return location.items.filter(itemId => isItemAvailable(locationId, itemId));
    };

    const getCondomCount = () => state.condomCount;
    const useCondom = () => {
        if (state.condomCount > 0) {
            state.condomCount--;
            state.lastCondomRestock = Date.now();
            return true;
        }
        return false;
    };
    
    const restockCondom = () => {
        if (state.condomCount < 5) {
            state.condomCount++;
            state.lastCondomRestock = Date.now();
            return state.condomCount;
        }
        return state.condomCount;
    };
    
    const canUseCondom = () => state.condomCount > 0 && state.adultMode;
    const getCondomStatus = () => ({
        count: state.condomCount,
        canRestock: state.canRestockCondoms,
        lastRestock: state.lastCondomRestock
    });
    
    const startCondomRestockSystem = () => {
        if (state.condomRestockTimer) {
            clearInterval(state.condomRestockTimer);
        }
        
        state.condomRestockTimer = setInterval(() => {
            if (state.condomCount < 3 && state.canRestockCondoms) {
                state.condomCount++;
                IntegratedUIManager.showNotification(`🔄 Protection restocked! Now have ${state.condomCount}.`, 'success');
                
                if (IntegratedUIManager.elements.inventoryGrid) {
                    IntegratedInventoryManager.renderInventory();
                }
            }
        }, 180000);
    };
    
    const stopCondomRestockSystem = () => {
        if (state.condomRestockTimer) {
            clearInterval(state.condomRestockTimer);
            state.condomRestockTimer = null;
        }
    };

    const updateNPCRelationship = (npcName, change) => {
        const npc = npcs[npcName];
        if (npc) {
            const oldValue = npc.relationship;
            npc.relationship = Math.max(0, Math.min(100, npc.relationship + change));
            state.relationship = npc.relationship;
            
            AnalyticsSystem.recordRelationshipChange(npcName, oldValue, npc.relationship);
            
            StoryEngine.checkStoryProgress(npcName, npc.relationship);
            
            AchievementSystem.checkAchievement('romantic');
            if (npc.relationship >= 50) {
                AchievementSystem.checkAchievement('romantic');
            }
            
            updateJealousy();
            
            if (change > 0) {
                EmotionSystem.influenceEmotion(npcName, 'joy', change);
            } else if (change < 0) {
                EmotionSystem.influenceEmotion(npcName, 'anger', -change);
            }
        }
    };

    return {
        getState: () => ({ ...state }),
        setState: (newState) => { 
            const oldState = { ...state };
            state = { ...state, ...newState };
            
            if (state.currentNPC && npcs[state.currentNPC]) {
                state.relationship = npcs[state.currentNPC].relationship;
            }
            
            if (newState.score !== oldState.score) {
                AchievementSystem.checkAchievement('rich');
            }
            if (newState.inventory && newState.inventory.length !== oldState.inventory?.length) {
                AchievementSystem.checkAchievement('collector');
            }
        },
        
        getSelectedItem,
        setSelectedItem,
        
        getLocations: () => [...locations],
        getLocation: (id) => locations.find(loc => loc.id === id),
        
        getItems: () => ({ ...items }),
        getItem: (id) => items[id],
        
        getNPCs: () => ({ ...npcs }),
        getNPC: (name) => npcs[name],
        updateNPC: (name, updates) => {
            if (npcs[name]) {
                const oldRelationship = npcs[name].relationship;
                npcs[name] = { ...npcs[name], ...updates };
                if (name === state.currentNPC) {
                    state.relationship = npcs[name].relationship;
                }
                
                if (updates.relationship !== undefined && updates.relationship !== oldRelationship) {
                    AnalyticsSystem.recordRelationshipChange(name, oldRelationship, updates.relationship);
                }
            }
        },
        updateNPCRelationship,
        
        getQuests: () => [...quests],
        getQuest: (id) => quests.find(q => q.id === id),
        getCurrentQuest: () => quests[state.currentQuest],
        
        getNPCDialogs: (npcName) => npcDialogs[npcName] || npcDialogs.Eve,
        
        getComments: () => [...npcComments],
        addComment: (comment) => {
            npcComments.unshift(comment);
            if (npcComments.length > 6) npcComments.pop();
            
            state.analytics = state.analytics || {};
            state.analytics.interactions = (state.analytics.interactions || 0) + 1;
        },
        
        getMessages: () => [...messages],
        addMessage: (message) => {
            messages.push(message);
            if (messages.length > 15) messages.shift();
        },
        
        getActiveRelationships,
        getAvailableNPCs,
        updateJealousy,
        scheduleDate,
        unlockEnding,
        
        markItemCollected,
        isItemAvailable,
        getAvailableItems,
        
        getCondomCount,
        useCondom,
        restockCondom,
        canUseCondom,
        getCondomStatus,
        startCondomRestockSystem,
        stopCondomRestockSystem,
        
        getAnalytics: () => ({ ...(state.analytics || {}) }),
        recordLocationVisit: (locationId) => {
            state.analytics = state.analytics || {};
            state.analytics.locationsVisited = state.analytics.locationsVisited || [];
            if (!state.analytics.locationsVisited.includes(locationId)) {
                state.analytics.locationsVisited.push(locationId);
            }
        }
    };
})();

// ===== INTEGRATED UI MANAGER (Enhanced) =====
const IntegratedUIManager = (() => {
    const elements = {};
    let eventListeners = new Map();
    
    const initialize = () => {
        console.log('Initializing UI Manager...');
        
        try {
            elements.ageGate = document.getElementById('age-gate');
            elements.gameContainer = document.getElementById('game-container');
            elements.loading = document.getElementById('loading');
            elements.loadingText = document.getElementById('loading-text');
            elements.adultIndicator = document.getElementById('adult-indicator');
            elements.enhancedIndicator = document.getElementById('enhanced-mode-indicator');
            elements.scoreValue = document.getElementById('score-value');
            elements.timeValue = document.getElementById('time-value');
            elements.relationshipValue = document.getElementById('relationship-value');
            elements.progressValue = document.getElementById('progress-value');
            elements.npcCount = document.getElementById('npc-count');
            elements.moodLevel = document.getElementById('mood-level');
            elements.locationName = document.getElementById('location-name');
            elements.questTracker = document.getElementById('quest-tracker');
            elements.currentQuest = document.getElementById('current-quest');
            elements.questDescription = document.getElementById('quest-description');
            elements.questBar = document.getElementById('quest-bar');
            elements.itemsContainer = document.getElementById('items-container');
            elements.inventoryGrid = document.getElementById('inventory-grid');
            elements.inventoryCount = document.getElementById('inventory-count');
            elements.dialogContent = document.getElementById('dialog-content');
            elements.dialogOptions = document.getElementById('dialog-options');
            elements.commentsContainer = document.getElementById('comments-container');
            elements.notification = document.getElementById('notification');
            elements.aiToggle = document.getElementById('ai-toggle');
            elements.aiStatus = document.getElementById('ai-status');
            elements.miniMap = document.getElementById('mini-map');
            elements.playerCharacter = document.getElementById('player-character');
            elements.eveCharacter = document.getElementById('eve-character');
            elements.currentNpc = document.getElementById('current-npc');
            elements.useBtn = document.getElementById('use-btn');
            
            elements.enhancedModeToggle = document.getElementById('enhanced-mode-toggle');
            elements.enhancedModeText = document.getElementById('enhanced-mode-text');
            elements.npcSelectorPanel = document.getElementById('npc-selector-panel');
            elements.npcSelectorGrid = document.getElementById('npc-selector-grid');
            elements.relationshipsPanel = document.getElementById('relationships-panel');
            elements.relationshipsList = document.getElementById('relationships-list');
            elements.currentNpcAvatar = document.getElementById('current-npc-avatar');
            elements.currentNpcName = document.getElementById('current-npc-name');
            elements.currentNpcMood = document.getElementById('current-npc-mood');
            elements.currentNpcRelationship = document.getElementById('current-npc-relationship');
            elements.npcDialogIndicator = document.getElementById('npc-dialog-indicator');
            
            elements.jealousyIndicator = document.getElementById('jealousy-indicator');
            elements.jealousyText = document.getElementById('jealousy-text');
            elements.dateScheduler = document.getElementById('date-scheduler');
            elements.dateScene = document.getElementById('date-scene');
            elements.endingGallery = document.getElementById('ending-gallery');
            elements.emotionWheel = document.getElementById('emotion-wheel');
            
            elements.storyEnginePanel = document.getElementById('story-engine-panel');
            elements.achievementsPanel = document.getElementById('achievements-panel');
            elements.analyticsPanel = document.getElementById('analytics-panel');
            elements.miniGamePanel = document.getElementById('mini-game-panel');
            
            if (elements.questBar) {
                elements.questBar.setAttribute('aria-valuenow', '0');
            }
            if (elements.moodLevel) {
                elements.moodLevel.setAttribute('aria-valuenow', '50');
            }
            
            if (elements.npcDialogIndicator) {
                elements.npcDialogIndicator.style.display = 'none';
            }
            if (elements.jealousyIndicator) {
                elements.jealousyIndicator.style.display = 'none';
            }
            if (elements.emotionWheel) {
                elements.emotionWheel.style.display = 'none';
            }
            
            initializeParticleBackground();
            
            console.log('UI Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UI Manager:', error);
        }
    };
    
    const initializeParticleBackground = () => {
        const container = document.getElementById('particle-background');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${Math.random() * 10 + 2}px`;
            particle.style.height = particle.style.width;
            particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.05})`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 20}s`;
            particle.style.animationDuration = `${Math.random() * 10 + 15}s`;
            container.appendChild(particle);
        }
    };
    
    const showLoading = (message = 'Loading...') => {
        if (elements.loadingText) elements.loadingText.textContent = message;
        if (elements.loading) elements.loading.style.display = 'flex';
    };
    
    const hideLoading = () => {
        if (elements.loading) elements.loading.style.display = 'none';
    };
    
    const showNotification = (text, type = '') => {
        if (!elements.notification) return;
        
        elements.notification.textContent = text;
        elements.notification.className = `notification ${type} show`;
        
        if (type === 'adult' || text.includes('Quest Completed') || text.includes('unlocked')) {
            elements.notification.style.animation = 'pulse 0.5s 2';
        }
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
            elements.notification.style.animation = '';
        }, 2000);
    };
    
    const updateStats = () => {
        const state = IntegratedGameState.getState();
        if (elements.scoreValue) elements.scoreValue.textContent = state.score;
        if (elements.relationshipValue) elements.relationshipValue.textContent = state.relationship;
        if (elements.progressValue) elements.progressValue.textContent = `${state.progress}%`;
        if (elements.moodLevel) {
            elements.moodLevel.style.width = `${state.mood}%`;
            elements.moodLevel.setAttribute('aria-valuenow', state.mood);
            
            if (state.mood > 70) {
                elements.moodLevel.style.background = 'linear-gradient(90deg, var(--success), var(--success-dark))';
            } else if (state.mood > 30) {
                elements.moodLevel.style.background = 'linear-gradient(90deg, var(--warning), var(--warning-dark))';
            } else {
                elements.moodLevel.style.background = 'linear-gradient(90deg, var(--danger), var(--danger-dark))';
            }
        }
        
        if (state.enhancedMode) {
            const activeNPCs = IntegratedGameState.getActiveRelationships().length;
            if (elements.npcCount) elements.npcCount.textContent = `${activeNPCs}/5`;
        }
    };
    
    const updateQuestTracker = () => {
        const currentQuest = IntegratedGameState.getCurrentQuest();
        if (!currentQuest || !elements.questBar) return;
        
        if (elements.currentQuest) elements.currentQuest.textContent = currentQuest.name;
        elements.questBar.style.width = `${currentQuest.progress}%`;
        elements.questBar.setAttribute('aria-valuenow', currentQuest.progress);
        if (elements.questDescription) elements.questDescription.textContent = currentQuest.description;
        if (elements.questTracker) elements.questTracker.style.display = 'block';
        
        if (currentQuest.progress < 30) {
            elements.questBar.style.background = 'linear-gradient(90deg, var(--danger), var(--danger-dark))';
        } else if (currentQuest.progress < 70) {
            elements.questBar.style.background = 'linear-gradient(90deg, var(--warning), var(--warning-dark))';
        } else {
            elements.questBar.style.background = 'linear-gradient(90deg, var(--success), var(--success-dark))';
        }
    };
    
    const addMessage = (text, sender, adult = false) => {
        if (!elements.dialogContent) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender === 'npc' ? 'npc-message' : 'player-message'} ${adult ? 'adult-message' : ''}`;
        messageElement.textContent = text;
        messageElement.setAttribute('role', 'listitem');
        
        elements.dialogContent.appendChild(messageElement);
        
        setTimeout(() => {
            elements.dialogContent.scrollTo({
                top: elements.dialogContent.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };
    
    const renderComments = () => {
        if (!elements.commentsContainer) return;
        
        elements.commentsContainer.innerHTML = '';
        const comments = IntegratedGameState.getComments();
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = `comment ${comment.adult ? 'adult-comment' : ''}`;
            commentElement.setAttribute('role', 'listitem');
            
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span>${comment.npc}</span>
                    <span>${comment.time}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            `;
            
            elements.commentsContainer.appendChild(commentElement);
        });
    };
    
    const toggleEnhancedMode = () => {
        const state = IntegratedGameState.getState();
        const newEnhancedMode = !state.enhancedMode;
        IntegratedGameState.setState({ enhancedMode: newEnhancedMode });
        
        if (newEnhancedMode) {
            if (elements.enhancedIndicator) elements.enhancedIndicator.style.display = 'block';
            if (elements.enhancedModeText) elements.enhancedModeText.textContent = 'Disable Enhanced Mode';
            if (elements.npcDialogIndicator) elements.npcDialogIndicator.style.display = 'flex';
            showNotification('🌟 Enhanced Mode Enabled! Multi-NPC features activated.', 'success');
            
            EmotionSystem.initializeEmotionWheel();
            EmotionSystem.updateEmotionDisplay(state.currentNPC);
            
            if (state.adultMode) {
                const currentInventory = state.inventory;
                const condomCount = IntegratedGameState.getCondomCount();
                
                if (!currentInventory.includes('condom') && condomCount > 0) {
                    currentInventory.push('condom');
                }
                
                if (!currentInventory.includes('ticket')) {
                    currentInventory.push('ticket');
                }
                IntegratedGameState.setState({ inventory: currentInventory });
            }
            
            updateCurrentNPC();
            renderNPCSelector();
            renderRelationships();
            IntegratedDialogManager.updateDialogOptions();
        } else {
            if (elements.enhancedIndicator) elements.enhancedIndicator.style.display = 'none';
            if (elements.enhancedModeText) elements.enhancedModeText.textContent = 'Enable Enhanced Mode';
            if (elements.npcDialogIndicator) elements.npcDialogIndicator.style.display = 'none';
            if (elements.npcSelectorPanel) elements.npcSelectorPanel.style.display = 'none';
            if (elements.relationshipsPanel) elements.relationshipsPanel.style.display = 'none';
            if (elements.emotionWheel) elements.emotionWheel.style.display = 'none';
            showNotification('📱 Basic Mode Enabled. Original gameplay restored.', 'warning');
            
            updateCurrentNPC();
            IntegratedDialogManager.updateDialogOptions();
        }
        
        renderInventory();
    };
    
    const updateCurrentNPC = () => {
        const state = IntegratedGameState.getState();
        const npc = IntegratedGameState.getNPC(state.currentNPC);
        
        if (npc) {
            if (elements.currentNpcAvatar) {
                elements.currentNpcAvatar.textContent = npc.emoji;
                elements.currentNpcAvatar.style.background = npc.color;
            }
            if (elements.currentNpcName) elements.currentNpcName.textContent = npc.name;
            if (elements.currentNpcMood) elements.currentNpcMood.textContent = npc.baseMood;
            if (elements.currentNpcRelationship) elements.currentNpcRelationship.textContent = npc.relationship;
            if (elements.currentNpc) elements.currentNpc.textContent = npc.name;
            
            if (elements.relationshipValue) elements.relationshipValue.textContent = npc.relationship;
            
            EmotionSystem.updateEmotionDisplay(state.currentNPC);
        } else {
            if (elements.currentNpc) elements.currentNpc.textContent = 'Eve';
            const eveNPC = IntegratedGameState.getNPC('Eve');
            if (eveNPC && elements.relationshipValue) {
                elements.relationshipValue.textContent = eveNPC.relationship;
            }
        }
    };
    
    const renderNPCSelector = () => {
        if (!elements.npcSelectorGrid) return;
        
        elements.npcSelectorGrid.innerHTML = '';
        const state = IntegratedGameState.getState();
        
        const currentLocation = IntegratedGameState.getLocation(state.currentLocation);
        const enhancedNPCs = ['Eve', 'Jessica', 'Danielle', 'Ashley', 'Nicole'];
        
        const locationNPCs = enhancedNPCs
            .map(name => IntegratedGameState.getNPC(name))
            .filter(npc => 
                npc && 
                currentLocation?.npcs.includes(npc.name) && 
                (state.adultMode || npc.adultTolerance >= 5)
            );
        
        locationNPCs.forEach(npc => {
            const npcElement = document.createElement('div');
            npcElement.className = `npc-portrait ${npc.id} ${npc.name === state.currentNPC ? 'active' : ''}`;
            
            npcElement.innerHTML = `
                <div class="npc-avatar" style="background: ${npc.color}">${npc.emoji}</div>
                <div class="npc-name">${npc.name}</div>
                <div class="npc-relationship">❤️ ${npc.relationship}</div>
            `;
            
            npcElement.addEventListener('click', () => {
                const oldNPC = state.currentNPC;
                
                if (oldNPC === npc.name) {
                    if (elements.npcSelectorPanel) elements.npcSelectorPanel.style.display = 'none';
                    return;
                }
                
                if (elements.dialogContent) elements.dialogContent.innerHTML = '';
                
                IntegratedGameState.setState({ currentNPC: npc.name });
                
                const dialogs = IntegratedGameState.getNPCDialogs(npc.name);
                if (dialogs && dialogs.greetings) {
                    const greeting = dialogs.greetings[Math.floor(Math.random() * dialogs.greetings.length)];
                    addMessage(`${npc.name}: ${greeting}`, 'npc');
                }
                
                updateCurrentNPC();
                renderNPCSelector();
                IntegratedDialogManager.updateDialogOptions();
                if (elements.npcSelectorPanel) elements.npcSelectorPanel.style.display = 'none';
                showNotification(`Now talking to ${npc.name}`);
                
                EmotionSystem.updateEmotionDisplay(npc.name);
                EmotionSystem.refreshEmotionWheelForNPC(npc.name);
                
                const emotionIndicator = document.getElementById('emotion-indicator');
                if (emotionIndicator) {
                    emotionIndicator.style.display = 'none';
                }
                
                const emotionSegments = document.querySelectorAll('.emotion-segment');
                emotionSegments.forEach(segment => segment.classList.remove('active'));
            });
            
            elements.npcSelectorGrid.appendChild(npcElement);
        });
        
        if (locationNPCs.length === 0) {
            elements.npcSelectorGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary)">No other NPCs available here.</div>';
        }
    };
    
    const renderRelationships = () => {
        if (!elements.relationshipsList) return;
        
        elements.relationshipsList.innerHTML = '';
        const relationships = IntegratedGameState.getActiveRelationships();
        
        if (relationships.length === 0) {
            elements.relationshipsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary)">No relationships yet. Talk to NPCs!</div>';
            return;
        }
        
        relationships.forEach(npc => {
            const relationshipElement = document.createElement('div');
            relationshipElement.className = 'relationship-item';
            
            relationshipElement.innerHTML = `
                <div class="relationship-info">
                    <div class="relationship-avatar" style="background: ${npc.color}">${npc.emoji}</div>
                    <div>
                        <div class="relationship-name">${npc.name}</div>
                        <div class="relationship-location">${npc.locations[0]}</div>
                    </div>
                </div>
                <div class="relationship-meter">
                    <div class="relationship-level" style="width: ${Math.min(100, npc.relationship)}%; background: ${npc.color}"></div>
                </div>
                <div class="relationship-value">${npc.relationship}</div>
            `;
            
            relationshipElement.addEventListener('click', () => {
                IntegratedGameState.setState({ currentNPC: npc.name });
                updateCurrentNPC();
                if (elements.relationshipsPanel) elements.relationshipsPanel.style.display = 'none';
                showNotification(`Now talking to ${npc.name}`);
                
                EmotionSystem.updateEmotionDisplay(npc.name);
            });
            
            elements.relationshipsList.appendChild(relationshipElement);
        });
    };
    
    const showJealousyEvent = (npcName) => {
        if (!IntegratedGameState.getState().enhancedMode) return;
        
        if (elements.jealousyText) elements.jealousyText.textContent = `${npcName} is getting jealous!`;
        if (elements.jealousyIndicator) {
            elements.jealousyIndicator.style.display = 'flex';
            
            setTimeout(() => {
                elements.jealousyIndicator.style.display = 'none';
            }, 3000);
        }
    };
    
    const showDateScheduler = () => {
        const state = IntegratedGameState.getState();
        if (!state.adultMode) {
            showNotification('Adult Mode required for dating!', 'warning');
            return;
        }
        
        renderDateScheduler();
        if (elements.dateScheduler) elements.dateScheduler.style.display = 'block';
    };
    
    const renderDateScheduler = () => {
        const npcSelect = document.getElementById('date-npc-select');
        if (!npcSelect) return;
        
        npcSelect.innerHTML = '';
        
        const availableNPCs = IntegratedGameState.getActiveRelationships()
            .filter(npc => npc.relationship > 30);
            
        if (availableNPCs.length === 0) {
            npcSelect.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary)">No NPCs available for dating yet. Build relationships first!</div>';
        } else {
            availableNPCs.forEach(npc => {
                const option = document.createElement('div');
                option.className = 'date-option';
                option.textContent = npc.name;
                option.dataset.npc = npc.name;
                npcSelect.appendChild(option);
            });
        }
        
        const locationSelect = document.getElementById('date-location-select');
        if (locationSelect) {
            locationSelect.innerHTML = '';
            
            IntegratedGameState.getLocations()
                .filter(loc => loc.dateAvailable && !loc.locked)
                .forEach(location => {
                    const option = document.createElement('div');
                    option.className = 'date-option';
                    option.textContent = location.name;
                    option.dataset.location = location.id;
                    locationSelect.appendChild(option);
                });
        }
            
        const timeSelect = document.getElementById('date-time-select');
        if (timeSelect) {
            timeSelect.innerHTML = '';
            ['Evening', 'Night', 'Late Night'].forEach(time => {
                const option = document.createElement('div');
                option.className = 'date-time-option';
                option.textContent = time;
                timeSelect.appendChild(option);
            });
        }
    };
    
    const addEventListener = (elementId, event, handler) => {
        const element = elements[elementId] || document.getElementById(elementId);
        if (!element) {
            console.warn(`Element #${elementId} not found for event listener`);
            return;
        }
        
        element.addEventListener(event, handler);
        const key = `${elementId}_${event}`;
        eventListeners.set(key, { element, event, handler });
    };
    
    const cleanupEventListeners = () => {
        eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        eventListeners.clear();
    };
    
    const renderInventory = () => {
        if (!elements.inventoryGrid) return;
        
        const inventoryGrid = elements.inventoryGrid;
        inventoryGrid.innerHTML = '';
        
        const state = IntegratedGameState.getState();
        const items = IntegratedGameState.getItems();
        
        const visibleItems = state.inventory.filter(itemId => {
            const item = items[itemId];
            return item && (state.adultMode || !item.adult);
        });
        
        const condomCount = IntegratedGameState.getCondomCount();
        const hasCondomsInInventory = state.inventory.includes('condom');
        
        if (elements.inventoryCount) {
            elements.inventoryCount.textContent = 
                `${visibleItems.length}${condomCount > 0 && !hasCondomsInInventory ? ` (+${condomCount})` : ''}`;
        }
        
        visibleItems.forEach(itemId => {
            const item = items[itemId];
            if (!item) return;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.setAttribute('role', 'gridcell');
            itemElement.tabIndex = 0;
            
            if (state.selectedItem === itemId) {
                itemElement.classList.add('selected');
                if (state.enhancedMode) {
                    itemElement.classList.add('glow');
                }
            }
            
            let displayEmoji = item.emoji;
            let displayName = item.name;
            
            if (itemId === 'condom') {
                displayEmoji = '💋';
                displayName = `Protection (${condomCount})`;
            }
            
            itemElement.innerHTML = `
                ${displayEmoji}
                <div class="item-name">${displayName}</div>
                ${item.adult ? '<div class="item-adult-badge" style="display: block;">18+</div>' : ''}
            `;
            
            itemElement.title = `${item.name}${item.adult ? ' (Adult Item)' : ''}`;
            
            itemElement.addEventListener('click', () => {
                const newSelected = state.selectedItem === itemId ? null : itemId;
                IntegratedGameState.setSelectedItem(newSelected);
                renderInventory();
                showNotification(`${newSelected === itemId ? 'Selected:' : 'Deselected:'} ${item.name}`);
            });
            
            inventoryGrid.appendChild(itemElement);
        });
        
        const emptySlots = 12 - visibleItems.length;
        for (let i = 0; i < emptySlots; i++) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'inventory-item';
            emptySlot.style.opacity = '0.3';
            emptySlot.innerHTML = '➕';
            emptySlot.title = 'Empty slot';
            emptySlot.setAttribute('role', 'gridcell');
            inventoryGrid.appendChild(emptySlot);
        }
    };
    
    const switchNPC = (npcName) => {
        const state = IntegratedGameState.getState();
        
        if (state.currentNPC === npcName) return;
        
        if (elements.dialogContent) elements.dialogContent.innerHTML = '';
        
        IntegratedGameState.setState({ currentNPC: npcName });
        
        const dialogs = IntegratedGameState.getNPCDialogs(npcName);
        if (dialogs && dialogs.greetings) {
            const greeting = dialogs.greetings[Math.floor(Math.random() * dialogs.greetings.length)];
            addMessage(`${npcName}: ${greeting}`, 'npc');
        }
        
        updateCurrentNPC();
        IntegratedDialogManager.updateDialogOptions();
        
        EmotionSystem.updateEmotionDisplay(npcName);
        EmotionSystem.refreshEmotionWheelForNPC(npcName);
        
        IntegratedInventoryManager.renderInventory();
        
        showNotification(`Now talking to ${npcName}`);
        
        return true;
    };
    
    return {
        elements,
        initialize,
        showLoading,
        hideLoading,
        showNotification,
        updateStats,
        updateQuestTracker,
        addMessage,
        renderComments,
        toggleEnhancedMode,
        updateCurrentNPC,
        renderNPCSelector,
        renderRelationships,
        showJealousyEvent,
        showDateScheduler,
        renderInventory,
        addEventListener,
        cleanupEventListeners,
        switchNPC
    };
})();

// ===== INTEGRATED SCENE MANAGER (Enhanced with Visuals) =====
const IntegratedSceneManager = (() => {
    const positionItems = (items) => {
        const positions = [];
        const gridCols = 5;
        const gridRows = Math.ceil(items.length / gridCols);
        const padding = 15;
        
        return items.map((item, index) => {
            const row = Math.floor(index / gridCols);
            const col = index % gridCols;
            
            const cellWidth = (100 - 2 * padding) / gridCols;
            const cellHeight = (100 - 2 * padding) / gridRows;
            
            const baseX = padding + col * cellWidth + cellWidth / 2;
            const baseY = padding + row * cellHeight + cellHeight / 2;
            
            const randomX = (Math.random() - 0.5) * (cellWidth * 0.3);
            const randomY = (Math.random() - 0.5) * (cellHeight * 0.3);
            
            const finalX = Math.max(padding, Math.min(100 - padding, baseX + randomX)) - 2.75;
            const finalY = Math.max(padding, Math.min(100 - padding, baseY + randomY)) - 2.75;
            
            return {
                x: finalX,
                y: finalY
            };
        });
    };
    
    const createParticleEffect = (x, y, color = 'var(--warning)') => {
        const container = document.getElementById('scene');
        if (!container) return;
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = color;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            particle.style.position = 'absolute';
            particle.style.borderRadius = '50%';
            particle.style.zIndex = '100';
            particle.style.animation = `collect 0.6s ease forwards`;
            particle.style.animationDelay = `${i * 0.05}s`;
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 600);
        }
    };
    
    const renderScene = () => {
        const state = IntegratedGameState.getState();
        const location = IntegratedGameState.getLocation(state.currentLocation);
        const itemsContainer = IntegratedUIManager.elements.itemsContainer;
        
        if (!location || !itemsContainer) return;
        
        if (IntegratedUIManager.elements.locationName) {
            IntegratedUIManager.elements.locationName.textContent = location.name;
        }
        
        IntegratedGameState.recordLocationVisit(state.currentLocation);
        
        itemsContainer.innerHTML = '';
        
        const availableItems = IntegratedGameState.getAvailableItems(state.currentLocation);
        
        const visibleItems = availableItems.filter(itemId => {
            const item = IntegratedGameState.getItem(itemId);
            return item && (state.adultMode || !item.adult);
        });
        
        const positions = positionItems(visibleItems);
        
        visibleItems.forEach((itemId, index) => {
            const item = IntegratedGameState.getItem(itemId);
            if (!item) return;
            
            const position = positions[index];
            const itemElement = document.createElement('div');
            
            itemElement.className = `interactive-item ${item.adult ? 'item-adult' : ''}`;
            if (state.enhancedMode && (item.adult || Math.random() > 0.7)) {
                itemElement.classList.add('glow');
            }
            itemElement.textContent = item.emoji;
            itemElement.title = `${item.name}${item.adult ? ' (18+)' : ''}`;
            itemElement.setAttribute('role', 'button');
            itemElement.setAttribute('aria-label', `Collect ${item.name}`);
            itemElement.tabIndex = 0;
            
            itemElement.style.left = `${position.x}%`;
            itemElement.style.top = `${position.y}%`;
            itemElement.style.zIndex = index + 1;
            itemElement.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
            itemElement.style.animationDelay = `${index * 0.1}s`;
            
            itemElement.addEventListener('click', (e) => {
                createParticleEffect(position.x, position.y, item.adult ? 'var(--adult)' : 'var(--warning)');
                IntegratedInventoryManager.collectItem(itemId, e);
            });
            
            itemElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                createParticleEffect(position.x, position.y, item.adult ? 'var(--adult)' : 'var(--warning)');
                IntegratedInventoryManager.collectItem(itemId, { target: itemElement });
            });
            
            itemsContainer.appendChild(itemElement);
        });
        
        const collectedItems = Object.keys(IntegratedGameState.getState().collectedItems)
            .filter(key => key.startsWith(state.currentLocation + '_'))
            .map(key => key.split('_')[1]);
        
        collectedItems.forEach((itemId, index) => {
            const item = IntegratedGameState.getItem(itemId);
            if (!item) return;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'interactive-item respawning';
            itemElement.textContent = item.emoji;
            itemElement.title = `${item.name} (Respawning...)`;
            itemElement.setAttribute('role', 'presentation');
            
            const col = index % 5;
            const row = Math.floor(index / 5);
            itemElement.style.left = `${15 + col * 15}%`;
            itemElement.style.top = `${80 + row * 15}%`;
            itemElement.style.opacity = '0.3';
            itemElement.style.animation = 'respawnPulse 1s ease-in-out infinite';
            
            itemsContainer.appendChild(itemElement);
        });
        
        renderNPCCharacters();
        
        if (visibleItems.length === 0 && collectedItems.length === 0) {
            const noItemsMsg = document.createElement('div');
            noItemsMsg.style.position = 'absolute';
            noItemsMsg.style.top = '50%';
            noItemsMsg.style.left = '50%';
            noItemsMsg.style.transform = 'translate(-50%, -50%)';
            noItemsMsg.style.color = 'var(--text-secondary)';
            noItemsMsg.style.fontStyle = 'italic';
            noItemsMsg.textContent = 'No interactive items here';
            itemsContainer.appendChild(noItemsMsg);
        }
    };
    
    const renderNPCCharacters = () => {
        const characterContainer = IntegratedUIManager.elements.playerCharacter?.parentElement;
        if (!characterContainer) return;
        
        const state = IntegratedGameState.getState();
        const location = IntegratedGameState.getLocation(state.currentLocation);
        
        if (!location) return;
        
        const existingNPCs = characterContainer.querySelectorAll('.npc');
        existingNPCs.forEach(npc => {
            if (npc.id !== 'eve-character') npc.remove();
        });
        
        const availableNPCs = IntegratedGameState.getAvailableNPCs();
        
        availableNPCs.forEach((npc, index) => {
            if (npc.name === 'Eve') return;
            
            if (!state.enhancedMode && npc.name !== state.currentNPC) return;
            
            const npcElement = document.createElement('div');
            npcElement.className = `npc ${npc.id} animated`;
            npcElement.id = `${npc.id}-character`;
            npcElement.setAttribute('role', 'button');
            npcElement.tabIndex = 0;
            npcElement.setAttribute('aria-label', `NPC character ${npc.name}`);
            
            const offset = (index) * 100;
            npcElement.style.position = 'absolute';
            npcElement.style.right = `${20 + offset}px`;
            npcElement.style.bottom = '30px';
            
            npcElement.innerHTML = `
                <div class="npc-body"></div>
                <div class="npc-head"></div>
                <div class="npc-tooltip">${npc.name}</div>
            `;
            
            npcElement.addEventListener('click', () => {
                IntegratedUIManager.switchNPC(npc.name);
                IntegratedUIManager.showNotification(`Now interacting with ${npc.name}`);
            });
            
            characterContainer.appendChild(npcElement);
        });
    };
    
    const renderMiniMap = () => {
        const miniMap = IntegratedUIManager.elements.miniMap;
        if (!miniMap) return;
        
        const locations = IntegratedGameState.getLocations();
        const state = IntegratedGameState.getState();
        
        miniMap.innerHTML = '';
        
        locations.forEach((location, index) => {
            const dot = document.createElement('div');
            dot.className = `map-dot ${location.id === state.currentLocation ? 'active' : ''} ${location.locked ? 'locked' : ''}`;
            dot.title = `${location.name}${location.locked ? ' (Locked)' : ''}`;
            dot.setAttribute('role', 'button');
            dot.setAttribute('aria-label', `Travel to ${location.name}`);
            dot.tabIndex = 0;
            
            if (location.locked) {
                dot.style.background = '#7f8c8d';
                dot.style.opacity = '0.5';
                dot.style.cursor = 'not-allowed';
            }
            
            dot.addEventListener('click', () => {
                if (location.locked) {
                    if (location.id === 'hotelRoom' && state.relationship < 70) {
                        IntegratedUIManager.showNotification(`You need relationship level 70+ to access the Hotel Suite! (Current: ${state.relationship})`, 'error');
                        return;
                    }
                }
                
                const transition = document.getElementById('scene-transition');
                if (transition) transition.style.opacity = '1';
                
                setTimeout(() => {
                    IntegratedGameState.setState({ currentLocation: location.id });
                    renderScene();
                    renderMiniMap();
                    IntegratedUIManager.showNotification(`Traveled to: ${location.name}`);
                    IntegratedUIManager.addMessage(`Larry: *Arrives at ${location.name}*`, 'player');
                    
                    if (transition) transition.style.opacity = '0';
                }, 300);
            });
            
            miniMap.appendChild(dot);
        });
    };
    
    return {
        renderScene,
        renderMiniMap
    };
})();

// ===== INTEGRATED INVENTORY MANAGER =====
const IntegratedInventoryManager = (() => {
    const renderInventory = () => {
        IntegratedUIManager.renderInventory();
    };
    
    const collectItem = (itemId, event) => {
        const state = IntegratedGameState.getState();
        const items = IntegratedGameState.getItems();
        const item = items[itemId];
        
        if (!item) return;
        
        if (itemId === 'condom') {
            IntegratedGameState.restockCondom();
            IntegratedUIManager.showNotification(`✅ Protection restocked! Now have ${IntegratedGameState.getCondomCount()}.`, 'success');
            renderInventory();
            
            IntegratedGameState.markItemCollected(state.currentLocation, itemId);
            IntegratedSceneManager.renderScene();
            return;
        }
        
        if (state.inventory.includes(itemId)) {
            IntegratedUIManager.showNotification(`Already have: ${item.name}`);
            return;
        }
        
        if (item.adult && !state.adultMode) {
            IntegratedUIManager.showNotification('Adult content item - Enable Adult Mode to collect', 'warning');
            return;
        }
        
        if (state.inventory.length >= 12) {
            IntegratedUIManager.showNotification('Inventory full! Cannot collect more items.', 'error');
            return;
        }
        
        const itemElement = event.target;
        itemElement.classList.add('collecting');
        
        const itemClone = itemElement.cloneNode(true);
        itemClone.style.position = 'fixed';
        itemClone.style.zIndex = '1000';
        itemClone.style.animation = 'none';
        itemClone.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        const itemRect = itemElement.getBoundingClientRect();
        itemClone.style.left = `${itemRect.left}px`;
        itemClone.style.top = `${itemRect.top}px`;
        
        document.body.appendChild(itemClone);
        
        const inventoryPanel = document.querySelector('.inventory-panel');
        const inventoryRect = inventoryPanel?.getBoundingClientRect();
        
        setTimeout(() => {
            if (inventoryRect) {
                itemClone.style.left = `${inventoryRect.left + 20}px`;
                itemClone.style.top = `${inventoryRect.top + 20}px`;
            }
            itemClone.style.transform = 'scale(0.5) rotate(720deg)';
            itemClone.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            itemClone.remove();
            
            IntegratedGameState.markItemCollected(state.currentLocation, itemId);
            
            const newInventory = [...state.inventory, itemId];
            const newScore = state.score + 50 + (item.adult ? 50 : 0);
            
            IntegratedGameState.setState({
                inventory: newInventory,
                score: newScore
            });
            
            IntegratedUIManager.showNotification(`Found: ${item.name}! +${50 + (item.adult ? 50 : 0)} points`, item.adult ? 'adult' : '');
            
            if (itemId === 'flowers') IntegratedQuestManager.updateQuestProgress(3, 50);
            if (itemId === 'perfume') IntegratedQuestManager.updateQuestProgress(4, 50);
            if (itemId === 'roomKey') IntegratedQuestManager.updateQuestProgress(5, 50);
            if (itemId === 'wine' || itemId === 'champagne') IntegratedQuestManager.updateQuestProgress(6, 10);
            if (itemId === 'drink') IntegratedQuestManager.updateQuestProgress(2, 30);
            
            AchievementSystem.checkAchievement('collector');
            
            renderInventory();
            IntegratedUIManager.updateStats();
            IntegratedQuestManager.updateOverallProgress();
            
            IntegratedSceneManager.renderScene();
        }, 600);
    };
    
    return {
        renderInventory,
        collectItem
    };
})();

// ===== INTEGRATED DIALOG MANAGER (Enhanced with Emotion and Story) =====
const IntegratedDialogManager = (() => {
    const updateDialogOptions = () => {
        const dialogOptions = IntegratedUIManager.elements.dialogOptions;
        if (!dialogOptions) return;
        
        dialogOptions.innerHTML = '';
        
        const state = IntegratedGameState.getState();
        let npc = IntegratedGameState.getNPC(state.currentNPC);
        
        if (!npc) {
            IntegratedGameState.setState({ currentNPC: 'Eve' });
            IntegratedUIManager.updateCurrentNPC();
            updateDialogOptions();
            return;
        }
        
        const currentQuest = IntegratedGameState.getCurrentQuest();
        
        const options = [
            { text: "Compliment her appearance", mood: 10, relationship: 5, adult: 0, questId: 1, progress: 30 },
            { text: "Offer a drink", mood: 5, relationship: 3, adult: 0, questId: 2, progress: 50 },
            { text: "Tell a joke", mood: -5, relationship: 2, adult: 0 },
            { text: "Ask about her interests", mood: 15, relationship: 8, adult: 0, questId: 1, progress: 20 },
            { text: "Share a personal story", mood: 20, relationship: 12, adult: 0, questId: 1, progress: 25 }
        ];
        
        if (state.enhancedMode && npc) {
            const dialogs = IntegratedGameState.getNPCDialogs(state.currentNPC);
            
            options[0].text = `Compliment ${npc.name}'s appearance`;
            options[3].text = `Ask about ${npc.name}'s interests`;
            
            const emotion = EmotionSystem.getEmotion(state.currentNPC);
            if (emotion) {
                switch(emotion.current) {
                    case 'joy':
                        options.push({ text: `Make ${npc.name} laugh`, mood: 15, relationship: 10, adult: 0, emotion: 'joy' });
                        break;
                    case 'sadness':
                        options.push({ text: `Cheer up ${npc.name}`, mood: 20, relationship: 15, adult: 0, emotion: 'sadness' });
                        break;
                    case 'anger':
                        options.push({ text: `Calm ${npc.name} down`, mood: 15, relationship: 12, adult: 0, emotion: 'anger' });
                        break;
                }
            }
            
            if (npc.storyProgress > 0) {
                options.push({ 
                    text: `Continue ${npc.name}'s story`, 
                    mood: 25, 
                    relationship: 15, 
                    adult: 0,
                    npcSpecific: true 
                });
            }
            
            const gifts = ['flowers', 'chocolate', 'wine', 'perfume'];
            gifts.forEach(gift => {
                if (state.inventory.includes(gift) && npc.giftPreferences.includes(gift)) {
                    const giftItem = IntegratedGameState.getItem(gift);
                    options.push({ 
                        text: `Give ${giftItem.name} to ${npc.name}`, 
                        mood: 30, 
                        relationship: 20, 
                        adult: 0,
                        item: gift,
                        npcSpecific: true 
                    });
                }
            });
            
            options.push({ 
                text: `Try to make ${npc.name} happy`, 
                mood: 10, 
                relationship: 8, 
                adult: 0,
                emotionManipulation: 'joy',
                enhanced: true
            });
        }
        
        if (IntegratedNPCAI.getAIMode()) {
            options.push(
                { text: "Try a clever pickup line", mood: 15, relationship: 10, adult: 0, questId: 1, progress: 20, smart: true }
            );
        }
        
        if (state.adultMode && state.relationship > 40) {
            options.push(
                { text: "Make a suggestive comment", mood: -10, relationship: 10, adult: 3, questId: 6, progress: 15 }
            );
        }
        
        if (state.adultMode && state.relationship > 60) {
            options.push(
                { text: "Whisper something naughty", mood: 5, relationship: 20, adult: 7, questId: 6, progress: 30 }
            );
        }
        
        if (currentQuest && !currentQuest.completed) {
            if (currentQuest.id === 3 && state.inventory.includes('flowers')) {
                options.push({ 
                    text: state.enhancedMode ? `Give ${npc?.name || 'her'} the flowers` : "Give her the flowers", 
                    mood: 30, 
                    relationship: 20, 
                    adult: 0, 
                    questId: 3, 
                    progress: 100 
                });
            }
            if (currentQuest.id === 4 && state.inventory.includes('perfume')) {
                options.push({ 
                    text: state.enhancedMode ? `Give ${npc?.name || 'her'} the perfume` : "Give her the perfume", 
                    mood: 25, 
                    relationship: 15, 
                    adult: 0, 
                    questId: 4, 
                    progress: 100 
                });
            }
        }
        
        if (state.enhancedMode && npc && npc.relationship > 50) {
            options.push({ 
                text: `Invite ${npc.name} on a date`, 
                mood: 20, 
                relationship: 15, 
                adult: true, 
                type: 'date',
                npcSpecific: true 
            });
        }
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = `dialog-option ${option.adult > 0 ? 'adult-option' : ''} ${option.smart ? 'ai-option' : ''} ${option.npcSpecific ? 'npc-specific' : ''} ${option.emotion ? 'emotion-option' : ''}`;
            optionElement.textContent = `${index + 1}. ${option.text}`;
            optionElement.setAttribute('role', 'menuitem');
            optionElement.tabIndex = 0;
            
            if (option.smart) {
                optionElement.style.border = '2px solid var(--primary)';
                optionElement.style.background = 'linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.2))';
            }
            
            if (option.npcSpecific) {
                optionElement.style.borderLeft = '4px solid var(--warning)';
            }
            
            if (option.emotion) {
                const emotionColor = EmotionSystem.getEmotion(npc?.name)?.current === option.emotion ? 
                    `var(--${option.emotion})` : 'var(--primary)';
                optionElement.style.border = `2px solid ${emotionColor}`;
            }
            
            let disabled = false;
            let disabledReason = '';
            
            if (option.adult > 0 && !state.adultMode) {
                disabled = true;
                disabledReason = "Adult content disabled";
            } else if (option.adult > (npc?.adultTolerance || 5)) {
                disabled = true;
                disabledReason = "Too forward for this character";
            } else if (option.text.includes("flowers") && !state.inventory.includes('flowers')) {
                disabled = true;
                disabledReason = "You need flowers first!";
            } else if (option.text.includes("perfume") && !state.inventory.includes('perfume')) {
                disabled = true;
                disabledReason = "You need perfume first!";
            } else if (option.smart && !IntegratedNPCAI.getAIMode()) {
                disabled = true;
                disabledReason = "AI Mode required for smart options";
            } else if (option.type === 'date' && !state.enhancedMode) {
                disabled = true;
                disabledReason = "Enhanced Mode required for dating";
            } else if (option.text.includes("drink") && !state.inventory.includes('drink') && 
                       !IntegratedGameState.isItemAvailable(state.currentLocation, 'drink')) {
                disabled = true;
                disabledReason = "Wait for drinks to respawn at the bar";
            }
            
            if (disabled) {
                optionElement.classList.add('disabled');
                optionElement.title = disabledReason;
            } else {
                optionElement.addEventListener('click', () => {
                    selectDialogOption(option, npc || { name: 'Eve' });
                });
                optionElement.title = option.questId ? "Advances quest progress" : 
                                    option.smart ? "Smart AI option" : 
                                    option.emotion ? "Emotion-based option" :
                                    option.npcSpecific ? "NPC-specific option" : "";
            }
            
            dialogOptions.appendChild(optionElement);
        });
    };
    
    const selectDialogOption = (option, npc) => {
        IntegratedUIManager.addMessage(`Larry: ${option.text}`, 'player', option.adult > 0);
        
        if (option.questId && option.progress) {
            IntegratedQuestManager.updateQuestProgress(option.questId, option.progress);
        }
        
        if (option.type === 'date') {
            setTimeout(() => {
                IntegratedUIManager.addMessage(`${npc.name}: A date? I'd like that. Where should we go?`, 'npc', true);
                setTimeout(() => {
                    IntegratedUIManager.showDateScheduler();
                }, 1000);
            }, 500);
            return;
        }
        
        if (option.emotionManipulation) {
            EmotionSystem.setEmotion(npc.name, option.emotionManipulation, 70);
        }
        
        setTimeout(() => {
            const npcResponse = IntegratedNPCAI.getResponse(
                IntegratedGameState.getState().mood,
                IntegratedGameState.getState().relationship,
                option.adult,
                npc.name
            );
            
            IntegratedUIManager.addMessage(`${npc.name}: ${npcResponse}`, 'npc', option.adult > 0);
            
            const state = IntegratedGameState.getState();
            
            const emotionModifier = EmotionSystem.getEmotionModifier(npc.name, 'mood');
            const responseModifier = EmotionSystem.getEmotionModifier(npc.name, 'response');
            
            const adjustedMoodChange = Math.floor(option.mood * emotionModifier);
            const adjustedRelationshipChange = Math.floor(option.relationship * responseModifier);
            
            const newMood = Math.max(0, Math.min(100, state.mood + adjustedMoodChange));
            const newRelationship = state.relationship + adjustedRelationshipChange;
            const newScore = state.score + 25 + (option.adult * 10) + (option.smart ? 15 : 0);
            
            IntegratedGameState.updateNPCRelationship(npc.name, adjustedRelationshipChange);
            
            IntegratedGameState.setState({
                mood: newMood,
                score: newScore
            });
            
            if (state.enhancedMode) {
                IntegratedGameState.updateNPC(npc.name, {
                    baseMood: Math.min(100, npc.baseMood + adjustedMoodChange),
                    intimacy: option.adult > 0 ? npc.intimacy + option.adult : npc.intimacy,
                    storyProgress: option.npcSpecific ? npc.storyProgress + 1 : npc.storyProgress
                });
                
                if (npc.name === state.currentNPC) {
                    if (option.mood > 0 && option.relationship > 0) {
                        IntegratedQuestManager.updateQuestProgress(7, 5);
                        IntegratedQuestManager.updateQuestProgress(1, option.smart ? 15 : 10);
                        
                        if (npc.relationship + adjustedRelationshipChange > 20) {
                            IntegratedQuestManager.updateQuestProgress(11, 10);
                        }
                        
                        if (option.emotion) {
                            IntegratedQuestManager.updateQuestProgress(12, 15);
                        }
                    }
                    
                    if (npc.relationship + adjustedRelationshipChange >= 100) {
                        IntegratedQuestManager.updateQuestProgress(9, 100);
                    }
                    
                    const activeNPCs = IntegratedGameState.getActiveRelationships();
                    if (activeNPCs.filter(n => n.relationship >= 50).length >= 4) {
                        IntegratedQuestManager.updateQuestProgress(10, 100);
                    }
                }
            } else {
                if (npc.name === 'Eve') {
                    if (option.mood > 0 && option.relationship > 0) {
                        IntegratedQuestManager.updateQuestProgress(1, option.smart ? 15 : 10);
                    }
                    
                    if (npcResponse.includes("full attention") || npcResponse.includes("my attention now")) {
                        IntegratedQuestManager.updateQuestProgress(1, 50);
                        IntegratedUIManager.showNotification("🏆 Eve is fully attentive!", "success");
                    }
                    
                    if (newMood > 70) {
                        IntegratedQuestManager.updateQuestProgress(1, 15);
                    }
                }
            }
            
            IntegratedUIManager.updateStats();
            IntegratedQuestManager.updateOverallProgress();
            
            const comment = IntegratedNPCAI.generateComment(npc.name, option.adult);
            IntegratedGameState.addComment({
                npc: npc.name,
                text: comment,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: option.adult > 0
            });
            IntegratedUIManager.renderComments();
            
            if (option.mood > 0) {
                const npcCharacter = document.getElementById(`${npc.id}-character`) || IntegratedUIManager.elements.eveCharacter;
                if (npcCharacter) {
                    npcCharacter.style.transform = 'translateY(-10px) scale(1.1)';
                    setTimeout(() => {
                        npcCharacter.style.transform = 'translateY(0) scale(1)';
                    }, 500);
                }
            }
            
            checkSpecialEvents(option, npc);
            
            if (state.enhancedMode) {
                IntegratedGameState.updateJealousy();
                const jealousyLevel = IntegratedGameState.getState().jealousyLevel;
                if (jealousyLevel > 50 && Math.random() > 0.7) {
                    IntegratedUIManager.showJealousyEvent(npc.name);
                }
            }
            
            if (option.item && IntegratedGameState.getState().inventory.includes(option.item)) {
                const newInventory = state.inventory.filter(item => item !== option.item);
                IntegratedGameState.setState({ inventory: newInventory });
                IntegratedInventoryManager.renderInventory();
            }
            
            updateDialogOptions();
        }, 500);
    };
    
    const checkSpecialEvents = (option, npc) => {
        const state = IntegratedGameState.getState();
        const locations = IntegratedGameState.getLocations();
        
        if (state.relationship >= 70 && locations[4].locked) {
            locations[4].locked = false;
            IntegratedUIManager.showNotification('🏨 Hotel Suite unlocked! Relationship level reached!', 'adult');
            IntegratedGameState.addComment({
                npc: npc.name,
                text: 'Maybe we should continue this in my suite...',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: true
            });
            IntegratedUIManager.renderComments();
            IntegratedSceneManager.renderMiniMap();
        }
    };
    
    return {
        updateDialogOptions,
        selectDialogOption
    };
})();

// ===== INTEGRATED ITEM USE HANDLER =====
const IntegratedItemUseHandler = (() => {
    const useSelectedItem = () => {
        const selectedItemId = IntegratedGameState.getSelectedItem();
        const state = IntegratedGameState.getState();
        
        if (!selectedItemId) {
            IntegratedUIManager.showNotification('Select an item from inventory first!', 'warning');
            return;
        }
        
        const item = IntegratedGameState.getItem(selectedItemId);
        if (!item) return;
        
        IntegratedUIManager.addMessage(`Larry: *Uses ${item.name}*`, 'player', item.adult);
        
        let moodChange = 0;
        let relationshipChange = 0;
        let questProgress = 0;
        let emotionEffect = null;
        
        switch(selectedItemId) {
            case 'flowers':
                moodChange = 20;
                relationshipChange = 10;
                questProgress = 50;
                emotionEffect = 'joy';
                IntegratedQuestManager.updateQuestProgress(3, questProgress);
                break;
            case 'drink':
                moodChange = 15;
                relationshipChange = 5;
                questProgress = 50;
                emotionEffect = 'joy';
                IntegratedQuestManager.updateQuestProgress(2, questProgress);
                break;
            case 'wine':
                moodChange = 25;
                relationshipChange = 15;
                questProgress = 25;
                emotionEffect = 'trust';
                IntegratedQuestManager.updateQuestProgress(6, questProgress);
                break;
            case 'champagne':
                moodChange = 30;
                relationshipChange = 20;
                questProgress = 30;
                emotionEffect = 'joy';
                IntegratedQuestManager.updateQuestProgress(6, questProgress);
                break;
            case 'condom':
                if (state.adultMode && state.relationship > 60) {
                    if (!IntegratedGameState.canUseCondom()) {
                        IntegratedUIManager.showNotification('No protection available! Restock at the bar, hotel, or casino.', 'warning');
                        moodChange = -10;
                        relationshipChange = -5;
                        break;
                    }
                    
                    IntegratedGameState.useCondom();
                    
                    moodChange = 40;
                    relationshipChange = 30;
                    questProgress = 50;
                    emotionEffect = 'trust';
                    IntegratedQuestManager.updateQuestProgress(6, questProgress);
                    IntegratedGameState.addComment({
                        npc: state.currentNPC || 'Eve',
                        text: 'He came prepared... smart and responsible.',
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        adult: true
                    });
                    
                    if (IntegratedGameState.getCondomCount() <= 1) {
                        IntegratedUIManager.showNotification('⚠️ Low on protection! Visit the bar, hotel, or casino to restock.', 'warning');
                    }
                } else {
                    moodChange = -20;
                    relationshipChange = -10;
                    IntegratedUIManager.showNotification('Too soon for that! Build relationship first.', 'warning');
                }
                break;
            case 'perfume':
                moodChange = 25;
                relationshipChange = 15;
                questProgress = 50;
                emotionEffect = 'anticipation';
                IntegratedQuestManager.updateQuestProgress(4, questProgress);
                break;
            case 'roomKey':
                moodChange = 35;
                relationshipChange = 25;
                questProgress = 50;
                emotionEffect = 'surprise';
                IntegratedQuestManager.updateQuestProgress(5, questProgress);
                break;
            default:
                moodChange = 5;
                relationshipChange = 3;
        }
        
        if (emotionEffect && state.enhancedMode) {
            EmotionSystem.influenceEmotion(state.currentNPC, emotionEffect, 20);
        }
        
        if (moodChange > 0 && relationshipChange > 0) {
            IntegratedQuestManager.updateQuestProgress(1, 15);
        }
        
        setTimeout(() => {
            const responses = [
                'Nice try, but not quite.',
                'Interesting choice...',
                'That was... unexpected.',
                'You\'re full of surprises.'
            ];
            
            if (moodChange > 20) {
                IntegratedUIManager.addMessage(`${state.currentNPC || 'Eve'}: Oh my! You really know how to impress a girl!`, 'npc', item.adult);
            } else if (moodChange > 0) {
                IntegratedUIManager.addMessage(`${state.currentNPC || 'Eve'}: ${responses[Math.floor(Math.random() * responses.length)]}`, 'npc', item.adult);
            } else {
                IntegratedUIManager.addMessage(`${state.currentNPC || 'Eve'}: That was... inappropriate.`, 'npc');
            }
            
            const newMood = Math.max(0, Math.min(100, state.mood + moodChange));
            const newRelationship = state.relationship + relationshipChange;
            const newScore = state.score + 50;
            
            IntegratedGameState.updateNPCRelationship(state.currentNPC, relationshipChange);
            
            IntegratedGameState.setState({
                mood: newMood,
                score: newScore,
                selectedItem: null
            });
            
            if (state.enhancedMode) {
                const npc = IntegratedGameState.getNPC(state.currentNPC);
                if (npc) {
                    IntegratedGameState.updateNPC(state.currentNPC, {
                        baseMood: Math.min(100, npc.baseMood + moodChange)
                    });
                }
            }
            
            const consumables = ['drink', 'wine', 'champagne', 'flowers', 'perfume', 'chocolate', 'cigar', 'whiskey', 'candle', 'lube'];
            if (consumables.includes(selectedItemId)) {
                const newInventory = state.inventory.filter(itemId => itemId !== selectedItemId);
                IntegratedGameState.setState({ inventory: newInventory });
            }
            
            IntegratedUIManager.updateStats();
            IntegratedInventoryManager.renderInventory();
        }, 500);
    };
    
    return {
        useSelectedItem
    };
})();

// ===== ENHANCED NPC AI SYSTEM (Enhanced with Emotion) =====
const IntegratedNPCAI = (() => {
    let aiMode = true;
    
    const responses = {
        ai_neutral: [
            "Interesting approach. Let's see where this goes.",
            "You're not like the others. I'll give you that.",
            "That was... unexpected.",
            "You certainly know how to get my attention.",
            "I'm listening. Continue."
        ],
        ai_positive: [
            "That's actually quite charming!",
            "You're making this difficult to resist.",
            "I'm starting to see your appeal.",
            "That was surprisingly sweet.",
            "Okay, you've got my full attention now."
        ],
        ai_negative: [
            "Seriously? That's your best line?",
            "I've had better conversations with a wall.",
            "You're trying too hard.",
            "That's not going to work on me.",
            "Maybe you should try a different approach."
        ],
        ai_adult: [
            "You're being quite forward... I like it.",
            "Now you're speaking my language.",
            "That's bold. Let's see if you can back it up.",
            "You have my attention... and my interest.",
            "Finally, someone who isn't afraid to be direct."
        ],
        
        simple_neutral: [
            "I see.",
            "Okay.",
            "Hmm.",
            "Interesting.",
            "I understand."
        ],
        simple_positive: [
            "That's nice.",
            "Good to know.",
            "Thank you.",
            "That's interesting.",
            "I appreciate that."
        ],
        simple_negative: [
            "I disagree.",
            "No thank you.",
            "That's not for me.",
            "I'd rather not.",
            "Let's change the subject."
        ],
        simple_adult: [
            "That's inappropriate.",
            "Please be respectful.",
            "Let's keep it friendly.",
            "I prefer polite conversation.",
            "That's not appropriate here."
        ]
    };
    
    const setAIMode = (enabled) => {
        aiMode = enabled;
    };
    
    const getAIMode = () => aiMode;
    
    const getResponse = (mood, relationship, adultLevel = 0, npcName = 'Eve') => {
        const state = IntegratedGameState.getState();
        let responseSet;
        
        const emotionResponse = EmotionSystem.getEmotionResponse(npcName, adultLevel > 0 ? 'insult' : 'compliment');
        if (emotionResponse && Math.random() > 0.3) {
            return emotionResponse;
        }
        
        if (aiMode) {
            if (relationship > 70 && adultLevel > 0 && state.adultMode) {
                responseSet = responses.ai_adult;
            } else if (mood > 70) {
                responseSet = responses.ai_positive;
            } else if (mood > 40) {
                responseSet = responses.ai_neutral;
            } else {
                responseSet = responses.ai_negative;
            }
        } else {
            if (adultLevel > 0 && state.adultMode) {
                responseSet = responses.simple_adult;
            } else if (mood > 60) {
                responseSet = responses.simple_positive;
            } else if (mood > 30) {
                responseSet = responses.simple_neutral;
            } else {
                responseSet = responses.simple_negative;
            }
        }
        
        const npcDialogs = IntegratedGameState.getNPCDialogs(npcName);
        if (npcDialogs && Math.random() > 0.5) {
            if (mood > 70 && npcDialogs.compliments) {
                responseSet = [...responseSet, ...npcDialogs.compliments];
            } else if (npcDialogs.greetings) {
                responseSet = [...responseSet, ...npcDialogs.greetings];
            }
        }
        
        if (state.enhancedMode && relationship > 20) {
            const storyDialog = StoryEngine.generateStoryDialog(npcName, relationship);
            if (storyDialog && Math.random() > 0.7) {
                responseSet = [storyDialog, ...responseSet];
            }
        }
        
        return responseSet[Math.floor(Math.random() * responseSet.length)];
    };
    
    const generateComment = (npcName, adultLevel = 0) => {
        const state = IntegratedGameState.getState();
        
        const emotion = EmotionSystem.getEmotion(npcName);
        if (emotion && Math.random() > 0.5) {
            const emotionComments = {
                joy: ["I'm really enjoying this!", "He makes me so happy!", "What a wonderful conversation!"],
                anger: ["How annoying!", "I can't believe he said that!", "This is so frustrating!"],
                trust: ["I feel like I can really trust him.", "He's so honest and genuine.", "I can open up to him."],
                anticipation: ["I wonder what he'll say next.", "This is getting interesting.", "What's going to happen?"]
            };
            
            if (emotionComments[emotion.current]) {
                return emotionComments[emotion.current][Math.floor(Math.random() * emotionComments[emotion.current].length)];
            }
        }
        
        if (aiMode) {
            const comments = [
                'He actually said something interesting for once.',
                'I might give him a chance if he keeps this up.',
                'Same old lines, different guy.',
                'There might be hope for him yet.',
                'I wonder if he knows how transparent he is.'
            ];
            
            if (adultLevel > 0 && state.adultMode) {
                comments.push(
                    'He\'s being quite forward... I like that.',
                    'Finally someone who isn\'t afraid to go there.',
                    'This could get interesting...',
                    'He knows what he wants, I\'ll give him that.',
                    'Maybe tonight won\'t be so boring after all.'
                );
            }
            
            if (state.mood > 70) {
                comments.push('I\'m actually enjoying this conversation!');
                comments.push('He\'s not like the others...');
            } else if (state.mood < 30) {
                comments.push('How much longer do I have to pretend to be interested?');
                comments.push('This is getting painful to watch.');
            }
            
            if (state.relationship > 50) {
                comments.push('He\'s growing on me...');
            }
            
            return comments[Math.floor(Math.random() * comments.length)];
        } else {
            const simpleComments = [
                'He\'s talking to me.',
                'Another conversation.',
                'I should respond.',
                'What should I say?',
                'This is a conversation.'
            ];
            
            if (adultLevel > 0 && state.adultMode) {
                simpleComments.push('That was forward.');
                simpleComments.push('Direct approach.');
            }
            
            if (state.mood > 70) {
                simpleComments.push('Nice conversation.');
                simpleComments.push('Enjoying this.');
            } else if (state.mood < 30) {
                simpleComments.push('Not great.');
                simpleComments.push('Could be better.');
            }
            
            return simpleComments[Math.floor(Math.random() * simpleComments.length)];
        }
    };
    
    return {
        getResponse,
        generateComment,
        setAIMode,
        getAIMode
    };
})();

// ===== INTEGRATED QUEST MANAGER (Enhanced) =====
const IntegratedQuestManager = (() => {
    const updateQuestProgress = (questId, amount) => {
        const quests = IntegratedGameState.getQuests();
        const quest = quests.find(q => q.id === questId);
        const state = IntegratedGameState.getState();
        
        if (quest && !quest.completed) {
            if (quest.enhanced && !state.enhancedMode) return;
            
            let actualAmount = amount;
            
            if (questId === 1) {
                const npc = IntegratedGameState.getNPC('Eve');
                
                if (npc && (npc.relationship > 40 || state.mood > 70)) {
                    actualAmount = Math.max(amount, 30);
                }
                
                if (state.relationship > 50) {
                    actualAmount = 100;
                }
            }
            
            if (state.enhancedMode && state.currentNPC) {
                const emotionModifier = EmotionSystem.getEmotionModifier(state.currentNPC, 'mood');
                actualAmount = Math.floor(actualAmount * emotionModifier);
            }
            
            const oldProgress = quest.progress;
            quest.progress = Math.min(100, Math.max(0, quest.progress + actualAmount));
            
            if (quest.progress !== oldProgress) {
                IntegratedUIManager.updateQuestTracker();
                
                if (actualAmount >= 10) {
                    IntegratedUIManager.showNotification(`Quest Progress: ${quest.name} (${quest.progress}%)`);
                }
                
                if (quest.progress >= 100) {
                    completeQuest(questId);
                }
            }
        }
    };
    
    const completeQuest = (questId) => {
        const quests = IntegratedGameState.getQuests();
        const quest = quests.find(q => q.id === questId);
        const state = IntegratedGameState.getState();
        
        if (quest && !quest.completed) {
            quest.completed = true;
            IntegratedGameState.setState({
                score: state.score + quest.reward,
                questsCompleted: state.questsCompleted + 1
            });
            
            const questBar = IntegratedUIManager.elements.questBar;
            if (questBar) questBar.style.animation = 'pulse 0.5s 3';
            
            IntegratedUIManager.showNotification(`🎉 Quest Completed: ${quest.name}! +${quest.reward} points`, 'success');
            
            const nextQuestIndex = quests.findIndex(q => !q.completed && (!q.enhanced || state.enhancedMode));
            
            setTimeout(() => {
                if (questBar) {
                    questBar.style.animation = '';
                    questBar.style.transition = 'none';
                    questBar.style.width = '0%';
                }
                
                if (nextQuestIndex !== -1) {
                    IntegratedGameState.setState({ currentQuest: nextQuestIndex });
                    
                    setTimeout(() => {
                        const nextQuest = quests[nextQuestIndex];
                        if (nextQuest && questBar) {
                            questBar.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                            questBar.style.width = `${nextQuest.progress}%`;
                        }
                    }, 50);
                }
                
                IntegratedUIManager.updateQuestTracker();
            }, 1500);
            
            updateOverallProgress();
            IntegratedUIManager.updateStats();
            
            AchievementSystem.checkAchievement('first_meeting');
            
            if (questId === 1) {
                IntegratedUIManager.addMessage('Eve: Well, you definitely have my attention now! What\'s next?', 'npc');
                IntegratedGameState.addComment({
                    npc: 'Eve',
                    text: 'He actually did it. He got my full attention. Now I\'m curious...',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: false
                });
                IntegratedUIManager.renderComments();
            }
            
            if (questId === 2) {
                IntegratedUIManager.addMessage('Eve: Thanks for the drink! That was sweet of you.', 'npc');
            }
            
            if (questId === 6) {
                IntegratedUIManager.addMessage('Eve: That was... amazing.', 'npc', true);
                IntegratedGameState.addComment({
                    npc: 'Eve',
                    text: 'I think I might actually like this guy...',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: true
                });
                IntegratedUIManager.renderComments();
            }
            
            if (questId === 7) {
                IntegratedUIManager.showNotification('🏆 All NPCs encountered! Social butterfly achievement unlocked!', 'adult');
                AchievementSystem.checkAchievement('social_butterfly');
            }
            
            if (questId === 9) {
                const npc = IntegratedGameState.getNPC(IntegratedGameState.getState().currentNPC);
                if (npc) {
                    IntegratedGameState.unlockEnding(npc.name, 'perfect');
                    IntegratedUIManager.showNotification(`🎉 Perfect Ending Unlocked with ${npc.name}!`, 'adult');
                }
            }
            
            if (questId === 11) {
                IntegratedUIManager.showNotification('📖 Story Teller achievement progress!', 'success');
            }
            
            if (questId === 12) {
                IntegratedUIManager.showNotification('💖 Emotion Master achievement progress!', 'success');
            }
        }
    };
    
    const updateOverallProgress = () => {
        const state = IntegratedGameState.getState();
        const quests = IntegratedGameState.getQuests();
        const availableQuests = quests.filter(q => !q.enhanced || state.enhancedMode);
        const completedQuests = availableQuests.filter(q => q.completed).length;
        const totalQuests = availableQuests.length;
        
        const progress = totalQuests > 0 ? Math.floor((completedQuests / totalQuests) * 100) : 0;
        IntegratedGameState.setState({ progress });
        
        if (IntegratedUIManager.elements.progressValue) {
            IntegratedUIManager.elements.progressValue.textContent = `${progress}%`;
        }
        
        if (progress > 0 && progress % 25 === 0) {
            const progressElement = IntegratedUIManager.elements.progressValue;
            if (progressElement) {
                progressElement.style.transform = 'scale(1.3)';
                progressElement.style.color = 'var(--warning)';
                setTimeout(() => {
                    progressElement.style.transform = 'scale(1)';
                    progressElement.style.color = '';
                }, 500);
                
                if (progress === 25) {
                    IntegratedUIManager.showNotification('🏆 25% Progress! Keep going!', 'success');
                } else if (progress === 50) {
                    IntegratedUIManager.showNotification('🏆 50% Progress! Halfway there!', 'warning');
                } else if (progress === 75) {
                    IntegratedUIManager.showNotification('🏆 75% Progress! Almost there!', 'success');
                } else if (progress === 100) {
                    IntegratedUIManager.showNotification('🎉 100% Progress! All quests completed!', 'adult');
                }
            }
        }
    };
    
    return {
        updateQuestProgress,
        completeQuest,
        updateOverallProgress
    };
})();

// ===== DATE SYSTEM =====
const DateSystem = (() => {
    const setupDateListeners = () => {
        const npcSelect = document.getElementById('date-npc-select');
        const locationSelect = document.getElementById('date-location-select');
        const timeSelect = document.getElementById('date-time-select');
        const confirmBtn = document.getElementById('confirm-date');
        const cancelBtn = document.getElementById('cancel-date');
        const dateContent = document.getElementById('date-content');
        
        if (npcSelect) {
            npcSelect.addEventListener('click', (e) => {
                const option = e.target.closest('.date-option');
                if (option && option.dataset.npc) {
                    document.querySelectorAll('#date-npc-select .date-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                }
            });
        }
        
        if (locationSelect) {
            locationSelect.addEventListener('click', (e) => {
                const option = e.target.closest('.date-option');
                if (option && option.dataset.location) {
                    document.querySelectorAll('#date-location-select .date-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                }
            });
        }
        
        if (timeSelect) {
            timeSelect.addEventListener('click', (e) => {
                const option = e.target.closest('.date-time-option');
                if (option) {
                    document.querySelectorAll('#date-time-select .date-time-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                }
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const selectedNPC = document.querySelector('#date-npc-select .date-option.selected');
                const selectedLocation = document.querySelector('#date-location-select .date-option.selected');
                const selectedTime = document.querySelector('#date-time-select .date-time-option.selected');
                
                if (selectedNPC && selectedLocation) {
                    const npcName = selectedNPC.dataset.npc;
                    const locationId = selectedLocation.dataset.location;
                    const time = selectedTime ? selectedTime.textContent : 'evening';
                    
                    IntegratedGameState.scheduleDate(npcName, locationId, time);
                    if (IntegratedUIManager.elements.dateScheduler) {
                        IntegratedUIManager.elements.dateScheduler.style.display = 'none';
                    }
                    IntegratedUIManager.showNotification(`Date scheduled with ${npcName}!`);
                    
                    setTimeout(() => {
                        showDateScene(npcName, locationId);
                    }, 1000);
                } else {
                    IntegratedUIManager.showNotification('Please select both an NPC and a location!', 'warning');
                }
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (IntegratedUIManager.elements.dateScheduler) {
                    IntegratedUIManager.elements.dateScheduler.style.display = 'none';
                }
            });
        }
        
        if (dateContent) {
            dateContent.addEventListener('click', (e) => {
                const choice = e.target.closest('.date-choice');
                if (choice && choice.dataset.choice) {
                    handleDateChoice(choice.dataset.choice);
                }
                
                if (e.target.id === 'end-date') {
                    if (IntegratedUIManager.elements.dateScene) {
                        IntegratedUIManager.elements.dateScene.style.display = 'none';
                    }
                    IntegratedUIManager.showNotification('Date completed successfully!');
                    
                    IntegratedQuestManager.updateQuestProgress(8, 33);
                    
                    AchievementSystem.checkAchievement('multi_dater');
                }
            });
        }
    };
    
    const showDateScene = (npcName, locationId) => {
        const npc = IntegratedGameState.getNPC(npcName);
        const location = IntegratedGameState.getLocation(locationId);
        
        if (npc && location) {
            const dateBackground = document.getElementById('date-background');
            const dateContent = document.getElementById('date-content');
            
            if (dateBackground) dateBackground.style.background = location.dateBackground;
            if (dateContent) {
                dateContent.innerHTML = `
                    <h2>Date with ${npc.name}</h2>
                    <div class="date-npc-dialogue">
                        "${getDateDialogue(npc, location)}"
                    </div>
                    <div class="date-choices">
                        <div class="date-choice" data-choice="compliment">Compliment her</div>
                        <div class="date-choice" data-choice="gift">Give a gift</div>
                        <div class="date-choice" data-choice="flirt">Flirt subtly</div>
                        <div class="date-choice" data-choice="story">Share a story</div>
                    </div>
                `;
            }
            
            if (IntegratedUIManager.elements.dateScene) {
                IntegratedUIManager.elements.dateScene.style.display = 'flex';
            }
        }
    };
    
    const getDateDialogue = (npc, location) => {
        const dialogues = {
            Eve: `I'm glad we could meet here at the ${location.name}. It's... nicer than I expected.`,
            Jessica: `Ooh, I love the ${location.name}! This is going to be fun!`,
            Danielle: `The ${location.name} is so beautiful tonight. Thank you for inviting me.`,
            Ashley: `Wow, the ${location.name}! Perfect choice for a date!`,
            Nicole: `The ${location.name}... interesting choice. Let's see where this goes.`
        };
        
        return dialogues[npc.name] || `Thanks for meeting me here at the ${location.name}.`;
    };
    
    const handleDateChoice = (choice) => {
        const state = IntegratedGameState.getState();
        const npc = IntegratedGameState.getNPC(state.currentNPC);
        
        if (!npc) return;
        
        let result = '';
        let moodChange = 0;
        let relationshipChange = 0;
        
        switch(choice) {
            case 'compliment':
                result = `"You're too kind!"`;
                moodChange = 15;
                relationshipChange = 8;
                EmotionSystem.influenceEmotion(npc.name, 'joy', 10);
                break;
            case 'gift':
                result = `"Another gift? You're spoiling me!"`;
                moodChange = 25;
                relationshipChange = 15;
                EmotionSystem.influenceEmotion(npc.name, 'trust', 15);
                break;
            case 'flirt':
                result = `*giggles* "You're being naughty..."`;
                moodChange = 20;
                relationshipChange = 12;
                EmotionSystem.influenceEmotion(npc.name, 'anticipation', 12);
                break;
            case 'story':
                result = `"That's a beautiful story. Thank you for sharing."`;
                moodChange = 18;
                relationshipChange = 10;
                EmotionSystem.influenceEmotion(npc.name, 'trust', 10);
                break;
        }
        
        IntegratedGameState.updateNPC(npc.name, {
            baseMood: Math.min(100, npc.baseMood + moodChange),
            relationship: npc.relationship + relationshipChange
        });
        
        IntegratedGameState.setState({
            mood: Math.min(100, state.mood + moodChange),
            relationship: state.relationship + relationshipChange,
            score: state.score + 100
        });
        
        const dateContent = document.getElementById('date-content');
        if (dateContent) {
            dateContent.innerHTML += `
                <div class="date-npc-dialogue">${npc.name}: ${result}</div>
                <button class="btn btn-success" id="end-date">End Date</button>
            `;
        }
        
        IntegratedUIManager.updateStats();
        
        if (npc.relationship + relationshipChange >= 100) {
            IntegratedGameState.unlockEnding(npc.name, 'perfect');
            IntegratedUIManager.showNotification(`🎉 Perfect Ending Unlocked with ${npc.name}!`, 'adult');
        }
    };
    
    return {
        setupDateListeners
    };
})();

// ===== ENDINGS SYSTEM =====
const EndingsSystem = (() => {
    const setupEndingsListeners = () => {
        const endingsBtn = document.getElementById('endings-btn');
        const closeEndings = document.getElementById('close-endings');
        
        if (endingsBtn) {
            endingsBtn.addEventListener('click', () => {
                if (IntegratedUIManager.elements.endingGallery) {
                    IntegratedUIManager.elements.endingGallery.style.display = 'block';
                    renderEndingsGallery();
                }
            });
        }
        
        if (closeEndings) {
            closeEndings.addEventListener('click', () => {
                if (IntegratedUIManager.elements.endingGallery) {
                    IntegratedUIManager.elements.endingGallery.style.display = 'none';
                }
            });
        }
    };
    
    const renderEndingsGallery = () => {
        const container = document.getElementById('endings-container');
        if (!container) return;
        
        const state = IntegratedGameState.getState();
        
        if (state.unlockedEndings.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary)">No endings unlocked yet! Complete relationships to unlock endings.</div>';
            return;
        }
        
        container.innerHTML = '';
        state.unlockedEndings.forEach(endingId => {
            const [npcName, endingType] = endingId.split('_');
            const npc = IntegratedGameState.getNPC(npcName);
            
            const endingCard = document.createElement('div');
            endingCard.className = 'ending-card';
            
            const endingTitles = {
                perfect: 'Perfect Romance',
                good: 'Happy Together',
                bad: 'Bitter End',
                neutral: 'Friends Forever'
            };
            
            endingCard.innerHTML = `
                <h3 class="ending-title">${endingTitles[endingType] || 'Special Ending'}</h3>
                <div class="ending-npc">
                    <div class="relationship-avatar" style="background: ${npc.color}">${npc.emoji}</div>
                    <div>
                        <div class="relationship-name">${npc.name}</div>
                        <div class="relationship-location">${endingType} Ending</div>
                    </div>
                </div>
                <div class="ending-description">
                    ${getEndingDescription(npcName, endingType)}
                </div>
                <div class="ending-requirements">
                    <strong>Requirements:</strong> Reach 100 relationship with ${npc.name}
                </div>
            `;
            
            container.appendChild(endingCard);
        });
    };
    
    const getEndingDescription = (npcName, endingType) => {
        const descriptions = {
            perfect: `You and ${npcName} found true love together. What started as a casual encounter blossomed into something beautiful and lasting. You both live happily ever after.`,
            good: `You and ${npcName} developed a strong bond. While not perfect, your relationship brings joy to both of your lives.`,
            neutral: `You and ${npcName} remained good friends. The romance didn't work out, but you found value in each other's company.`,
            bad: `Things didn't work out with ${npcName}. Maybe it was timing, maybe it was chemistry... but this story ends here.`
        };
        
        return descriptions[endingType] || `You reached a special ending with ${npcName}.`;
    };
    
    return {
        setupEndingsListeners,
        renderEndingsGallery
    };
})();

// ===== INTEGRATED GAME ENGINE (Enhanced) =====
const IntegratedGameEngine = (() => {
    let gameTimer;
    
    const init = () => {
        console.log('Initializing game engine...');
        try {
            IntegratedUIManager.initialize();
            IntegratedNPCAI.setAIMode(IntegratedGameState.getState().aiMode);
            
            setupAgeGate();
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            alert('Game initialization failed. Please check the console for errors.');
        }
    };
    
    const setupAgeGate = () => {
        const ageConfirm = document.getElementById('age-confirm');
        const ageDeny = document.getElementById('age-deny');
        
        if (ageConfirm) {
            ageConfirm.addEventListener('click', () => {
                IntegratedGameState.setState({
                    ageVerified: true,
                    adultMode: true
                });
                
                IntegratedUIManager.showLoading('Initializing game...');
                
                setTimeout(() => {
                    if (IntegratedUIManager.elements.ageGate) {
                        IntegratedUIManager.elements.ageGate.style.display = 'none';
                    }
                    if (IntegratedUIManager.elements.gameContainer) {
                        IntegratedUIManager.elements.gameContainer.style.display = 'block';
                        IntegratedUIManager.elements.gameContainer.setAttribute('aria-hidden', 'false');
                    }
                    if (IntegratedUIManager.elements.adultIndicator) {
                        IntegratedUIManager.elements.adultIndicator.style.display = 'block';
                    }
                    
                    const state = IntegratedGameState.getState();
                    if (state.adultMode) {
                        const newInventory = [...state.inventory, 'ticket'];
                        if (IntegratedGameState.getCondomCount() > 0) {
                            newInventory.push('condom');
                        }
                        IntegratedGameState.setState({ inventory: newInventory });
                    }
                    
                    IntegratedUIManager.hideLoading();
                    IntegratedUIManager.showNotification('Adult Mode Enabled! Welcome to the full experience!', 'adult');
                    startGame();
                }, 1000);
            });
        }
        
        if (ageDeny) {
            ageDeny.addEventListener('click', () => {
                IntegratedGameState.setState({
                    ageVerified: true,
                    adultMode: false
                });
                
                IntegratedUIManager.showLoading('Initializing game...');
                
                setTimeout(() => {
                    if (IntegratedUIManager.elements.ageGate) {
                        IntegratedUIManager.elements.ageGate.style.display = 'none';
                    }
                    if (IntegratedUIManager.elements.gameContainer) {
                        IntegratedUIManager.elements.gameContainer.style.display = 'block';
                        IntegratedUIManager.elements.gameContainer.setAttribute('aria-hidden', 'false');
                    }
                    
                    IntegratedUIManager.hideLoading();
                    IntegratedUIManager.showNotification('Standard Mode Enabled. Some content may be restricted.');
                    startGame();
                }, 1000);
            });
        }
    };
    
    const startGame = () => {
        try {
            IntegratedUIManager.updateStats();
            IntegratedSceneManager.renderScene();
            IntegratedSceneManager.renderMiniMap();
            IntegratedInventoryManager.renderInventory();
            
            IntegratedGameState.startCondomRestockSystem();
            
            EmotionSystem.initializeEmotionWheel();
            
            const state = IntegratedGameState.getState();
            EmotionSystem.setEmotion(state.currentNPC, 'anticipation', 50);
            
            IntegratedUIManager.addMessage('Eve: Another night, another hopeful romantic. Make it interesting.', 'npc');
            
            IntegratedGameState.addComment({
                npc: 'Eve',
                text: 'I wonder if this one will actually say something original for once.',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: false
            });
            IntegratedUIManager.renderComments();
            
            IntegratedDialogManager.updateDialogOptions();
            startGameTimer();
            setupEventListeners();
            
            if (IntegratedUIManager.elements.questTracker) {
                IntegratedUIManager.elements.questTracker.style.display = 'block';
            }
            IntegratedQuestManager.updateOverallProgress();
            IntegratedUIManager.updateQuestTracker();
        } catch (error) {
            console.error('Game initialization error:', error);
            IntegratedUIManager.showNotification('Game initialization failed! Please refresh.', 'error');
        }
    };
    
    const startGameTimer = () => {
        clearInterval(gameTimer);
        gameTimer = setInterval(() => {
            const state = IntegratedGameState.getState();
            IntegratedGameState.setState({ time: state.time + 1 });
            
            const minutes = Math.floor(state.time / 60);
            const seconds = state.time % 60;
            if (IntegratedUIManager.elements.timeValue) {
                IntegratedUIManager.elements.timeValue.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (state.time % 60 === 0) {
                const newMood = Math.max(0, state.mood - 1);
                IntegratedGameState.setState({ mood: newMood });
                IntegratedUIManager.updateStats();
            }
            
            if (state.time % 30 === 0) {
                AchievementSystem.checkAllAchievements();
            }
        }, 1000);
    };
    
    const setupEventListeners = () => {
        IntegratedUIManager.addEventListener('look-btn', 'click', () => {
            IntegratedUIManager.addMessage('Larry: *Looks around the room*', 'player');
            IntegratedGameState.addComment({
                npc: IntegratedGameState.getState().currentNPC,
                text: 'He\'s looking around like a lost puppy.',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: false
            });
            IntegratedUIManager.renderComments();
            IntegratedQuestManager.updateQuestProgress(1, 5);
        });
        
        IntegratedUIManager.addEventListener('talk-btn', 'click', () => {
            IntegratedDialogManager.updateDialogOptions();
            IntegratedUIManager.showNotification('Dialog options updated!');
        });
        
        if (IntegratedUIManager.elements.useBtn) {
            IntegratedUIManager.elements.useBtn.addEventListener('click', () => {
                IntegratedItemUseHandler.useSelectedItem();
            });
        }
        
        IntegratedUIManager.addEventListener('move-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            const locations = IntegratedGameState.getLocations();
            const currentIndex = locations.findIndex(loc => loc.id === state.currentLocation);
            let nextIndex = (currentIndex + 1) % locations.length;
            
            while (locations[nextIndex]?.locked) {
                nextIndex = (nextIndex + 1) % locations.length;
                if (nextIndex === currentIndex) break;
            }
            
            const transition = document.getElementById('scene-transition');
            if (transition) transition.style.opacity = '1';
            
            setTimeout(() => {
                IntegratedGameState.setState({ currentLocation: locations[nextIndex].id });
                IntegratedUIManager.showNotification(`Moved to: ${locations[nextIndex].name}`);
                IntegratedSceneManager.renderScene();
                IntegratedSceneManager.renderMiniMap();
                
                IntegratedGameState.addComment({
                    npc: state.currentNPC,
                    text: 'He moved to a different location. Persistent, I\'ll give him that.',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: false
                });
                IntegratedUIManager.renderComments();
                
                IntegratedDialogManager.updateDialogOptions();
                
                if (transition) transition.style.opacity = '0';
            }, 300);
        });
        
        IntegratedUIManager.addEventListener('examine-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            const examineTexts = {
                bar: "The bar is dimly lit with a sophisticated atmosphere. There's a jukebox in the corner playing soft jazz. Several interesting items are scattered around.",
                hotel: "The hotel lobby is luxurious with marble floors. The reception desk looks expensive. You notice some items on the tables.",
                beach: "The beach is beautiful with golden sand. The sunset creates a romantic atmosphere. Various beach items are visible.",
                casino: "The casino is bustling with activity. Slot machines ring and cards shuffle. There might be useful items around.",
                hotelRoom: "The suite is spacious with a king-size bed and a balcony overlooking the city. Romantic items are placed around the room."
            };
            
            IntegratedUIManager.addMessage(`Larry: ${examineTexts[state.currentLocation] || "It's an interesting place."}`, 'player');
            IntegratedGameState.addComment({
                npc: state.currentNPC,
                text: 'He\'s examining the surroundings. At least he\'s observant.',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: false
            });
            IntegratedUIManager.renderComments();
            IntegratedQuestManager.updateQuestProgress(1, 10);
        });
        
        IntegratedUIManager.addEventListener('flirt-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            if (!state.adultMode) {
                IntegratedUIManager.showNotification('Flirt mode requires Adult Mode to be enabled!', 'warning');
                return;
            }
            
            const flirtLines = [
                "Your eyes are like deep pools I could swim in... all night.",
                "Is it hot in here, or is it just you?",
                "I'm not a photographer, but I can picture us together.",
                "Do you believe in love at first sight, or should I walk by again?",
                "If you were a fruit, you'd be a fine-apple."
            ];
            
            const flirtLine = flirtLines[Math.floor(Math.random() * flirtLines.length)];
            IntegratedUIManager.addMessage(`Larry: ${flirtLine}`, 'player', true);
            
            setTimeout(() => {
                if (state.relationship > 40) {
                    const responses = IntegratedNPCAI.getAIMode() ? [
                        "*giggles* Smooth, very smooth.",
                        "Okay, that was actually good.",
                        "You're charming, I'll give you that.",
                        "Keep talking like that and you might just get somewhere."
                    ] : [
                        "That's nice.",
                        "Thank you.",
                        "I appreciate that.",
                        "That's interesting."
                    ];
                    IntegratedUIManager.addMessage(`${state.currentNPC}: ${responses[Math.floor(Math.random() * responses.length)]}`, 'npc', true);
                    const newMood = Math.min(100, state.mood + 15);
                    const newRelationship = state.relationship + 10;
                    IntegratedGameState.setState({
                        mood: newMood,
                        relationship: newRelationship
                    });
                    IntegratedQuestManager.updateQuestProgress(6, 10);
                    IntegratedQuestManager.updateQuestProgress(1, 20);
                    
                    EmotionSystem.influenceEmotion(state.currentNPC, 'joy', 15);
                } else {
                    IntegratedUIManager.addMessage(`${state.currentNPC}: Seriously? Try harder.`, 'npc');
                    const newMood = Math.max(0, state.mood - 10);
                    IntegratedGameState.setState({ mood: newMood });
                    EmotionSystem.influenceEmotion(state.currentNPC, 'anger', 10);
                }
                IntegratedUIManager.updateStats();
            }, 500);
        });
        
        IntegratedUIManager.addEventListener('quest-info-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            const currentQuest = IntegratedGameState.getCurrentQuest();
            const allQuests = IntegratedGameState.getQuests();
            
            let info = `=== QUEST PROGRESS ===\n`;
            info += `Overall: ${state.progress}%\n`;
            info += `Quests Completed: ${state.questsCompleted}/${allQuests.filter(q => !q.enhanced || state.enhancedMode).length}\n\n`;
            
            info += `CURRENT QUEST:\n`;
            info += `→ ${currentQuest.name}\n`;
            info += `Progress: ${currentQuest.progress}%\n`;
            info += `Objective: ${currentQuest.objective || currentQuest.description}\n`;
            info += `Reward: ${currentQuest.reward} points\n\n`;
            
            info += `UPCOMING QUESTS:\n`;
            allQuests.forEach((quest, index) => {
                if ((!quest.enhanced || state.enhancedMode) && index >= state.currentQuest && index < state.currentQuest + 3) {
                    const status = quest.completed ? '✓' : index === state.currentQuest ? '→' : '○';
                    info += `${status} ${quest.name} ${quest.adult ? '(18+)' : ''} ${quest.enhanced ? '[Enhanced]' : ''}\n`;
                }
            });
            
            alert(info);
        });
        
        if (IntegratedUIManager.elements.enhancedModeToggle) {
            IntegratedUIManager.elements.enhancedModeToggle.addEventListener('click', () => {
                IntegratedUIManager.toggleEnhancedMode();
            });
        }
        
        IntegratedUIManager.addEventListener('npc-selector-toggle-btn', 'click', () => {
            if (IntegratedUIManager.elements.npcSelectorPanel) {
                const panel = IntegratedUIManager.elements.npcSelectorPanel;
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') {
                    IntegratedUIManager.renderNPCSelector();
                }
            }
        });
        
        IntegratedUIManager.addEventListener('relationships-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to view relationships!', 'warning');
                return;
            }
            
            if (IntegratedUIManager.elements.relationshipsPanel) {
                const panel = IntegratedUIManager.elements.relationshipsPanel;
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') {
                    IntegratedUIManager.renderRelationships();
                }
            }
        });
        
        IntegratedUIManager.addEventListener('date-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to schedule dates!', 'warning');
                return;
            }
            
            IntegratedUIManager.showDateScheduler();
        });
        
        IntegratedUIManager.addEventListener('buy-condoms-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.adultMode) {
                IntegratedUIManager.showNotification('Adult Mode required to buy protection!', 'warning');
                return;
            }
            
            const canBuyHere = ['bar', 'hotel', 'casino'].includes(state.currentLocation);
            
            if (!canBuyHere) {
                IntegratedUIManager.showNotification('Can only buy protection at the bar, hotel, or casino!', 'warning');
                return;
            }
            
            if (state.score < 50) {
                IntegratedUIManager.showNotification(`Need $50 to buy protection! You have $${state.score}.`, 'error');
                return;
            }
            
            if (IntegratedGameState.getCondomCount() >= 5) {
                IntegratedUIManager.showNotification('Already have maximum protection (5)!', 'warning');
                return;
            }
            
            IntegratedGameState.restockCondom();
            IntegratedGameState.setState({ score: state.score - 50 });
            
            IntegratedUIManager.addMessage(`Larry: *Buys protection* Always be prepared!`, 'player', true);
            IntegratedUIManager.showNotification(`✅ Bought protection! Now have ${IntegratedGameState.getCondomCount()}. -$50`, 'success');
            IntegratedUIManager.updateStats();
            IntegratedInventoryManager.renderInventory();
        });
        
        IntegratedUIManager.addEventListener('achievements-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to view achievements!', 'warning');
                return;
            }
            
            if (IntegratedUIManager.elements.achievementsPanel) {
                const panel = IntegratedUIManager.elements.achievementsPanel;
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') {
                    AchievementSystem.renderAchievements();
                }
            }
        });
        
        IntegratedUIManager.addEventListener('analytics-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to view analytics!', 'warning');
                return;
            }
            
            if (IntegratedUIManager.elements.analyticsPanel) {
                const panel = IntegratedUIManager.elements.analyticsPanel;
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') {
                    AnalyticsSystem.renderRelationshipGraph();
                }
            }
        });
        
        IntegratedUIManager.addEventListener('story-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to view story progress!', 'warning');
                return;
            }
            
            if (IntegratedUIManager.elements.storyEnginePanel) {
                const panel = IntegratedUIManager.elements.storyEnginePanel;
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'block') {
                    StoryEngine.renderStoryProgress();
                }
            }
        });
        
        IntegratedUIManager.addEventListener('mini-game-btn', 'click', () => {
            const state = IntegratedGameState.getState();
            
            if (!state.enhancedMode) {
                IntegratedUIManager.showNotification('Enable Enhanced Mode to play mini-games!', 'warning');
                return;
            }
            
            MiniGameSystem.startMiniGame('poker');
        });
        
        IntegratedUIManager.addEventListener('save-btn', 'click', () => {
            try {
                const saveData = {
                    state: IntegratedGameState.getState(),
                    npcs: IntegratedGameState.getNPCs(),
                    quests: IntegratedGameState.getQuests(),
                    collectedItems: IntegratedGameState.getState().collectedItems
                };
                localStorage.setItem('larryEnhancedGameSave', JSON.stringify(saveData));
                IntegratedUIManager.showNotification('Game saved successfully!');
                IntegratedGameState.addComment({
                    npc: IntegratedGameState.getState().currentNPC,
                    text: 'He saved the game. Not confident about his chances?',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: false
                });
                IntegratedUIManager.renderComments();
            } catch (error) {
                IntegratedUIManager.showNotification('Failed to save game!', 'error');
            }
        });
        
        IntegratedUIManager.addEventListener('load-btn', 'click', () => {
            try {
                const savedGame = localStorage.getItem('larryEnhancedGameSave');
                if (savedGame) {
                    const saveData = JSON.parse(savedGame);
                    
                    IntegratedGameState.setState(saveData.state);
                    
                    Object.keys(saveData.npcs).forEach(npcName => {
                        IntegratedGameState.updateNPC(npcName, saveData.npcs[npcName]);
                    });
                    
                    saveData.quests.forEach((savedQuest, index) => {
                        const quests = IntegratedGameState.getQuests();
                        if (quests[index]) {
                            quests[index].progress = savedQuest.progress;
                            quests[index].completed = savedQuest.completed;
                        }
                    });
                    
                    IntegratedNPCAI.setAIMode(saveData.state.aiMode);
                    
                    IntegratedGameState.stopCondomRestockSystem();
                    IntegratedGameState.startCondomRestockSystem();
                    
                    IntegratedUIManager.updateStats();
                    IntegratedSceneManager.renderScene();
                    IntegratedSceneManager.renderMiniMap();
                    IntegratedInventoryManager.renderInventory();
                    IntegratedUIManager.updateCurrentNPC();
                    
                    if (saveData.state.enhancedMode) {
                        if (IntegratedUIManager.elements.enhancedIndicator) {
                            IntegratedUIManager.elements.enhancedIndicator.style.display = 'block';
                        }
                        if (IntegratedUIManager.elements.enhancedModeText) {
                            IntegratedUIManager.elements.enhancedModeText.textContent = 'Disable Enhanced Mode';
                        }
                        if (IntegratedUIManager.elements.npcDialogIndicator) {
                            IntegratedUIManager.elements.npcDialogIndicator.style.display = 'flex';
                        }
                        IntegratedUIManager.renderNPCSelector();
                        IntegratedUIManager.renderRelationships();
                    }
                    
                    IntegratedUIManager.showNotification('Game loaded successfully!');
                    IntegratedGameState.addComment({
                        npc: IntegratedGameState.getState().currentNPC,
                        text: 'He loaded a previous save. Trying to undo mistakes?',
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        adult: false
                    });
                    IntegratedUIManager.renderComments();
                } else {
                    IntegratedUIManager.showNotification('No saved game found!', 'warning');
                }
            } catch (error) {
                IntegratedUIManager.showNotification('Failed to load game!', 'error');
            }
        });
        
        IntegratedUIManager.addEventListener('reset-btn', 'click', () => {
            if (confirm('Are you sure you want to reset the game? All progress will be lost!')) {
                localStorage.removeItem('larryEnhancedGameSave');
                location.reload();
            }
        });
        
        IntegratedUIManager.addEventListener('ai-toggle', 'click', () => {
            const state = IntegratedGameState.getState();
            const newAiMode = !state.aiMode;
            IntegratedGameState.setState({ aiMode: newAiMode });
            IntegratedNPCAI.setAIMode(newAiMode);
            
            if (IntegratedUIManager.elements.aiStatus) {
                IntegratedUIManager.elements.aiStatus.textContent = `AI: ${newAiMode ? 'ON' : 'OFF'}`;
            }
            if (IntegratedUIManager.elements.aiToggle) {
                IntegratedUIManager.elements.aiToggle.style.background = newAiMode ? 
                    'linear-gradient(135deg, var(--primary), var(--primary-dark))' :
                    'linear-gradient(135deg, var(--surface-light), var(--surface-dark))';
            }
            
            if (newAiMode) {
                IntegratedUIManager.showNotification('🤖 AI Mode Enabled: NPCs use smart, contextual responses');
            } else {
                IntegratedUIManager.showNotification('📝 Simple Mode: NPCs use basic, predictable responses');
            }
            
            IntegratedDialogManager.updateDialogOptions();
            
            IntegratedGameState.addComment({
                npc: IntegratedGameState.getState().currentNPC,
                text: newAiMode ? 
                    'My conversational AI just got an upgrade!' :
                    'Switching to basic response mode.',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                adult: false
            });
            IntegratedUIManager.renderComments();
        });
        
        if (IntegratedUIManager.elements.playerCharacter) {
            IntegratedUIManager.elements.playerCharacter.addEventListener('click', () => {
                IntegratedUIManager.addMessage('Larry: *Adjusts his tie* Looking good!', 'player');
                IntegratedGameState.addComment({
                    npc: IntegratedGameState.getState().currentNPC,
                    text: 'He\'s checking himself out. How vain.',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    adult: false
                });
                IntegratedUIManager.renderComments();
            });
        }
        
        if (IntegratedUIManager.elements.eveCharacter) {
            IntegratedUIManager.elements.eveCharacter.addEventListener('click', () => {
                const state = IntegratedGameState.getState();
                if (state.relationship > 50) {
                    if (IntegratedNPCAI.getAIMode()) {
                        IntegratedUIManager.addMessage('Eve: *smiles* Enjoying the view?', 'npc', true);
                    } else {
                        IntegratedUIManager.addMessage('Eve: Hello.', 'npc');
                    }
                    const newMood = Math.min(100, state.mood + 5);
                    IntegratedGameState.setState({ mood: newMood });
                    IntegratedUIManager.updateStats();
                    IntegratedQuestManager.updateQuestProgress(1, 5);
                    
                    EmotionSystem.influenceEmotion('Eve', 'joy', 5);
                } else {
                    IntegratedUIManager.addMessage('Eve: Can I help you?', 'npc');
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                const options = document.querySelectorAll('.dialog-option:not(.disabled)');
                if (options[index]) {
                    options[index].click();
                }
            }
            
            if (e.key === ' ' && IntegratedGameState.getSelectedItem()) {
                IntegratedItemUseHandler.useSelectedItem();
            }
        });
        
        DateSystem.setupDateListeners();
        EndingsSystem.setupEndingsListeners();
    };
    
    return {
        init,
        startGame
    };
})();

// ===== INITIALIZE GAME =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    IntegratedGameEngine.init();
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
    IntegratedUIManager.showNotification('A game error occurred. Please refresh.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    IntegratedUIManager.showNotification('A game error occurred. Please refresh.', 'error');
});

// ===== CLEANUP ON UNLOAD =====
window.addEventListener('beforeunload', () => {
    IntegratedUIManager.cleanupEventListeners();
    clearInterval(IntegratedGameEngine.gameTimer);
    
    const state = IntegratedGameState.getState();
    Object.keys(state.respawnTimers).forEach(timerId => {
        clearTimeout(state.respawnTimers[timerId]);
    });
    
    IntegratedGameState.stopCondomRestockSystem();
});
