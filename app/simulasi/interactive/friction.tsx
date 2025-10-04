import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth } = Dimensions.get('window');

function FrictionSimulationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { topicSlug, topicName } = useLocalSearchParams<{ 
    topicSlug: string; 
    topicName: string; 
  }>();
  
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [simulationStarted, setSimulationStarted] = useState(false);

  // ✅ Matter.js HTML untuk simulasi gaya gesek
  const frictionSimulationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Friction Simulation</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                overflow: hidden;
            }
            
            #simulation-container {
                width: 100vw;
                height: 100vh;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            
            #controls {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 15px;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .control-group {
                margin-bottom: 10px;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #2c3e50;
                font-size: 14px;
            }
            
            input[type="range"] {
                width: 100%;
                margin-bottom: 5px;
            }
            
            .value-display {
                color: #7f8c8d;
                font-size: 12px;
                text-align: center;
            }
            
            .button-group {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            button {
                flex: 1;
                padding: 8px;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                font-size: 12px;
            }
            
            .start-btn {
                background: #27ae60;
                color: white;
            }
            
            .reset-btn {
                background: #e74c3c;
                color: white;
            }
            
            .info-btn {
                background: #3498db;
                color: white;
            }
            
            #canvas-container {
                flex: 1;
                position: relative;
            }
            
            #info-panel {
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                padding: 10px;
                z-index: 100;
                display: none;
            }
            
            .physics-info {
                font-size: 12px;
                line-height: 1.4;
                color: #2c3e50;
            }
        </style>
    </head>
    <body>
        <div id="simulation-container">
            <div id="controls">
                <div class="control-group">
                    <label>Force Applied (N)</label>
                    <input type="range" id="forceSlider" min="0" max="100" value="20">
                    <div class="value-display">Force: <span id="forceValue">20</span> N</div>
                </div>
                
                <div class="control-group">
                    <label>Friction Coefficient (μ)</label>
                    <input type="range" id="frictionSlider" min="0" max="1" step="0.1" value="0.3">
                    <div class="value-display">μ = <span id="frictionValue">0.3</span></div>
                </div>
                
                <div class="control-group">
                    <label>Mass (kg)</label>
                    <input type="range" id="massSlider" min="1" max="10" value="5">
                    <div class="value-display">Mass: <span id="massValue">5</span> kg</div>
                </div>
                
                <div class="button-group">
                    <button class="start-btn" onclick="startSimulation()">Start</button>
                    <button class="reset-btn" onclick="resetSimulation()">Reset</button>
                    <button class="info-btn" onclick="toggleInfo()">Info</button>
                </div>
            </div>
            
            <div id="canvas-container"></div>
            
            <div id="info-panel">
                <div class="physics-info">
                    <strong>Gaya Gesek (Friction Force)</strong><br>
                    • Gaya gesek statis: F<sub>s</sub> = μ<sub>s</sub> × N<br>
                    • Gaya gesek kinetik: F<sub>k</sub> = μ<sub>k</sub> × N<br>
                    • N = Normal force = m × g<br>
                    • Objek akan bergerak jika F<sub>applied</sub> > F<sub>static</sub>
                </div>
            </div>
        </div>

        <script>
            const Engine = Matter.Engine;
            const Render = Matter.Render;
            const World = Matter.World;
            const Bodies = Matter.Bodies;
            const Body = Matter.Body;
            const Vector = Matter.Vector;
            const Events = Matter.Events;

            let engine, render, world;
            let box, ground;
            let appliedForce = 20;
            let frictionCoeff = 0.3;
            let mass = 5;
            let isSimulationRunning = false;

            function initializeSimulation() {
                // Create engine
                engine = Engine.create();
                world = engine.world;
                engine.world.gravity.y = 0.8;

                // Create render
                const container = document.getElementById('canvas-container');
                render = Render.create({
                    element: container,
                    engine: engine,
                    options: {
                        width: container.clientWidth,
                        height: container.clientHeight,
                        wireframes: false,
                        background: 'transparent',
                        showAngleIndicator: true,
                        showVelocity: true
                    }
                });

                // Create ground
                ground = Bodies.rectangle(
                    render.options.width / 2, 
                    render.options.height - 30, 
                    render.options.width, 
                    60, 
                    { 
                        isStatic: true,
                        render: {
                            fillStyle: '#8B4513'
                        }
                    }
                );

                // Create box
                createBox();

                // Add bodies to world
                World.add(world, [ground, box]);

                // Start render
                Render.run(render);

                // Update simulation
                Events.on(engine, 'beforeUpdate', function() {
                    if (isSimulationRunning) {
                        applyForces();
                    }
                });

                Engine.run(engine);
            }

            function createBox() {
                const boxWidth = 60;
                const boxHeight = 40;
                const boxX = 100;
                const boxY = render.options.height - 100;

                box = Bodies.rectangle(boxX, boxY, boxWidth, boxHeight, {
                    mass: mass,
                    frictionAir: 0.001,
                    friction: frictionCoeff,
                    render: {
                        fillStyle: '#e74c3c',
                        strokeStyle: '#c0392b',
                        lineWidth: 2
                    }
                });
            }

            function applyForces() {
                if (!box || !isSimulationRunning) return;

                // Calculate friction force
                const normalForce = mass * engine.world.gravity.y * engine.world.gravity.scale;
                const maxStaticFriction = frictionCoeff * normalForce;
                
                // Apply horizontal force
                const forceVector = Vector.create(appliedForce * 0.001, 0);
                Body.applyForce(box, box.position, forceVector);

                // Visual feedback
                updateSimulationInfo();
            }

            function updateSimulationInfo() {
                if (!box) return;
                
                const velocity = box.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // Send data to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'simulationData',
                        data: {
                            position: box.position,
                            velocity: velocity,
                            speed: speed.toFixed(2),
                            appliedForce: appliedForce,
                            frictionCoeff: frictionCoeff,
                            mass: mass
                        }
                    }));
                }
            }

            function startSimulation() {
                isSimulationRunning = true;
                document.querySelector('.start-btn').textContent = 'Running...';
                document.querySelector('.start-btn').style.background = '#f39c12';
            }

            function resetSimulation() {
                isSimulationRunning = false;
                
                if (box) {
                    World.remove(world, box);
                }
                
                createBox();
                World.add(world, box);
                
                document.querySelector('.start-btn').textContent = 'Start';
                document.querySelector('.start-btn').style.background = '#27ae60';
            }

            function toggleInfo() {
                const infoPanel = document.getElementById('info-panel');
                infoPanel.style.display = infoPanel.style.display === 'none' ? 'block' : 'none';
            }

            // Event listeners for controls
            document.getElementById('forceSlider').addEventListener('input', function(e) {
                appliedForce = parseInt(e.target.value);
                document.getElementById('forceValue').textContent = appliedForce;
            });

            document.getElementById('frictionSlider').addEventListener('input', function(e) {
                frictionCoeff = parseFloat(e.target.value);
                document.getElementById('frictionValue').textContent = frictionCoeff;
                if (box) {
                    box.friction = frictionCoeff;
                }
            });

            document.getElementById('massSlider').addEventListener('input', function(e) {
                mass = parseInt(e.target.value);
                document.getElementById('massValue').textContent = mass;
                if (box) {
                    Body.setMass(box, mass);
                }
            });

            // Initialize when page loads
            window.addEventListener('load', function() {
                setTimeout(initializeSimulation, 100);
                
                // Notify React Native that simulation is ready
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'simulationReady'
                    }));
                }
            });

            // Handle window resize
            window.addEventListener('resize', function() {
                if (render) {
                    render.canvas.width = window.innerWidth;
                    render.canvas.height = window.innerHeight;
                }
            });
        </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'simulationReady':
          setLoading(false);
          console.log('✅ Friction simulation ready');
          break;
          
        case 'simulationData':
          // Handle real-time simulation data
          if (!simulationStarted) {
            setSimulationStarted(true);
          }
          break;
          
        default:
          console.log('📊 Simulation message:', message);
      }
    } catch (error) {
      console.error('❌ WebView message parsing error:', error);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Exit Simulation',
      'Are you sure you want to exit the friction simulation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🔥 {topicName || 'Gaya Gesek'}</Text>
          <Text style={styles.headerSubtitle}>Interactive Matter.js Simulation</Text>
        </View>
      </View>

      {/* WebView Container */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading simulation...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: frictionSimulationHTML }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          scrollEnabled={false}
          onLoadEnd={() => {
            console.log('✅ WebView loaded');
          }}
          onError={(error) => {
            console.error('❌ WebView error:', error);
            Alert.alert('Error', 'Failed to load simulation. Please try again.');
          }}
        />
      </View>

      {/* Simulation Status */}
      {!loading && (
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>🎮</Text>
            <Text style={styles.statusText}>
              {simulationStarted ? 'Simulation Running' : 'Ready to Start'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>🔬</Text>
            <Text style={styles.statusText}>Matter.js Physics</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FrictionSimulationScreen() {
  return (
    <AuthGuard>
      <FrictionSimulationContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // WebView
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});