// app/simulasi/gesek-miring.tsx
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useRef } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { colors } from "../../constants/theme";

const simConfig = {
  question_text:
    "Perhatikan tiga balok dengan koefisien gesekan berbeda pada bidang miring. Seret balok dengan mouse untuk melihat perbedaan gerakan. Balok atas: friction=0.001, Balok tengah: friction=0.0005, Balok bawah: friction=0 (licin)",
  simulation_type: "friction_interactive",
  parameters: {
    gravity: 9.8,
    angle: 30,
  },
};

const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body,html{margin:0;padding:0;overflow:hidden;background:#f0f9ff;font-family:Arial,sans-serif;}
  canvas{display:block;border:1px solid #ddd;width:100%;height:100%;}
  .info{position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.95);padding:8px;border-radius:8px;font-size:11px;max-width:200px;z-index:10;}
  .container{width:100vw;height:100vh;position:relative;}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
</head>
<body>
<div class="container">
  <div class="info">
    <strong>Gaya Gesek</strong><br>
    🔴 Friction: 0.001<br>
    🟡 Friction: 0.0005<br>
    🟢 Friction: 0 (licin)<br>
    <em>Drag balok untuk eksperimen!</em>
  </div>
  <canvas id="world"></canvas>
</div>
<script>
  const { Engine, Render, Runner, Bodies, Composite, Body, Events, Mouse, MouseConstraint } = Matter;
  
  function sendToRN(obj){ 
    if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){ 
      window.ReactNativeWebView.postMessage(JSON.stringify(obj)); 
    } 
  }

  let engine, render, runner, mouse, mouseConstraint;
  let blocks = [];

  function getCanvasSize() {
    // Optimized for landscape mode
    const width = Math.max(window.innerWidth, 600);
    const height = Math.max(window.innerHeight - 20, 300);
    return { width, height };
  }

  function setupSimulation(cfg){
    const canvas = document.getElementById('world');
    const { width, height } = getCanvasSize();
    
    // create engine
    engine = Engine.create();
    const world = engine.world;
    
    // create renderer optimized for landscape
    render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: width,
        height: height,
        showVelocity: true,
        wireframes: false,
        background: '#f0f9ff',
        pixelRatio: window.devicePixelRatio || 1
      }
    });
    
    Render.run(render);
    
    // create runner
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // walls
    Composite.add(world, [
      Bodies.rectangle(width/2, 0, width, 20, { isStatic: true, render: { fillStyle: '#444' } }),
      Bodies.rectangle(width/2, height, width, 20, { isStatic: true, render: { fillStyle: '#444' } }),
      Bodies.rectangle(width, height/2, 20, height, { isStatic: true, render: { fillStyle: '#444' } }),
      Bodies.rectangle(0, height/2, 20, height, { isStatic: true, render: { fillStyle: '#444' } })
    ]);
    
    // Landscape layout - horizontal arrangement
    const spacing = width * 0.25;
    const startX = width * 0.15;
    const centerY = height * 0.5;
    
    const angleRad = (cfg.parameters?.angle || 25) * Math.PI / 180;
    const inclineWidth = width * 0.2;
    
    // Bidang miring 1 - friction tinggi
    const incline1 = Bodies.rectangle(startX, centerY - 60, inclineWidth, 15, { 
      isStatic: true, 
      angle: angleRad, 
      render: { fillStyle: '#060a19' } 
    });
    const block1 = Bodies.rectangle(startX - 40, centerY - 100, 35, 35, { 
      friction: 0.001,
      render: { fillStyle: '#ff4444' }
    });
    
    // Bidang miring 2 - friction sedang
    const incline2 = Bodies.rectangle(startX + spacing, centerY - 60, inclineWidth, 15, { 
      isStatic: true, 
      angle: angleRad, 
      render: { fillStyle: '#060a19' } 
    });
    const block2 = Bodies.rectangle(startX + spacing - 40, centerY - 100, 35, 35, { 
      friction: 0.0005,
      render: { fillStyle: '#ffdd44' }
    });
    
    // Bidang miring 3 - friction rendah (licin)
    const incline3 = Bodies.rectangle(startX + spacing * 2, centerY - 60, inclineWidth, 15, { 
      isStatic: true, 
      angle: angleRad, 
      render: { fillStyle: '#060a19' } 
    });
    const block3 = Bodies.rectangle(startX + spacing * 2 - 40, centerY - 100, 35, 35, { 
      friction: 0,
      render: { fillStyle: '#44ff44' }
    });
    
    Composite.add(world, [incline1, block1, incline2, block2, incline3, block3]);
    blocks = [block1, block2, block3];
    
    // add mouse control
    mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.3,
        render: {
          visible: false
        }
      }
    });
    
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    // Event tracking
    Events.on(mouseConstraint, 'startdrag', function(event) {
      const blockIndex = blocks.findIndex(block => block === event.body);
      if(blockIndex !== -1) {
        const frictions = ["0.001", "0.0005", "0"];
        const colors = ["Merah", "Kuning", "Hijau"];
        sendToRN({ 
          type: 'drag_start', 
          blockIndex, 
          friction: frictions[blockIndex],
          color: colors[blockIndex]
        });
      }
    });
    
    Events.on(mouseConstraint, 'enddrag', function(event) {
      const blockIndex = blocks.findIndex(block => block === event.body);
      if(blockIndex !== -1) {
        sendToRN({ type: 'drag_end', blockIndex });
      }
    });
    
    sendToRN({ type: 'ready' });
  }

  function resetSimulation() {
    if(blocks.length > 0) {
      const { width, height } = getCanvasSize();
      const spacing = width * 0.25;
      const startX = width * 0.15;
      const centerY = height * 0.5;
      
      Body.setPosition(blocks[0], { x: startX - 40, y: centerY - 100 });
      Body.setPosition(blocks[1], { x: startX + spacing - 40, y: centerY - 100 });
      Body.setPosition(blocks[2], { x: startX + spacing * 2 - 40, y: centerY - 100 });
      
      blocks.forEach(block => {
        Body.setVelocity(block, { x: 0, y: 0 });
        Body.setAngularVelocity(block, 0);
      });
      
      sendToRN({ type: 'reset_complete' });
    }
  }

  // Message handlers
  window.addEventListener('message', (e) => {
    try { 
      const msg = JSON.parse(e.data); 
      if(msg.action === 'setup') {
        setupSimulation(msg.config);
      } else if(msg.action === 'reset') {
        resetSimulation();
      }
    } catch(err) { 
      sendToRN({ type:'error', message: err.message }); 
    }
  }, false);
  
  document.addEventListener('message', (e) => {
    try { 
      const msg = JSON.parse(e.data); 
      if(msg.action === 'setup') {
        setupSimulation(msg.config);
      } else if(msg.action === 'reset') {
        resetSimulation();
      }
    } catch(err) { 
      sendToRN({ type:'error', message: err.message }); 
    }
  }, false);

  sendToRN({ type: 'loaded' });
</script>
</body>
</html>
`;

export default function GesekMiring() {
  const webviewRef = useRef<WebView>(null);

  // Auto landscape when entering simulation
  useFocusEffect(
    React.useCallback(() => {
      const lockToLandscape = async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (error) {
          console.warn('Could not lock to landscape:', error);
        }
      };

      const unlockOrientation = async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (error) {
          console.warn('Could not unlock orientation:', error);
        }
      };

      // lockToLandscape();

      // Cleanup - unlock when leaving screen
      return () => {
        unlockOrientation();
      };
    }, [])
  );

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      
      if (msg.type === "loaded") {
        webviewRef.current?.postMessage(JSON.stringify({
          action: 'setup',
          config: simConfig
        }));
      }
      
      if (msg.type === "drag_start") {
        console.log(`Menyeret blok ${msg.color} (friction: ${msg.friction})`);
      }
      
      if (msg.type === "reset_complete") {
        Alert.alert("Reset", "Semua blok dikembalikan ke posisi awal");
      }
      
    } catch (err) {
      console.warn("webview msg parse failed", err);
    }
  };

  const resetSimulation = () => {
    webviewRef.current?.postMessage(JSON.stringify({
      action: 'reset'
    }));
  };

  return (
    <View style={styles.container}>
      {/* Minimal header for landscape */}
      <View style={styles.headerLandscape}>
        <Text style={styles.titleLandscape}>Simulasi Gaya Gesek - Bidang Miring</Text>
        <Button 
          title="Reset" 
          onPress={resetSimulation} 
          color={colors.primary} 
        />
      </View>

      <View style={styles.webWrapLandscape}>
        <WebView
          originWhitelist={["*"]}
          ref={webviewRef}
          // source={{ html }}
          source={{uri: 'http://192.168.40.146:8000/login'}}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background
  },
  headerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },
  titleLandscape: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    flex: 1
  },
  webWrapLandscape: { 
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff"
  }
});