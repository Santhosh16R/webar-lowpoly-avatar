import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

export class AvatarController {
  /**
   * @param {THREE.Scene | THREE.Group} parentGroup - Where to attach the avatar
   * @param {Object} options - { useCustomGLB: false, glbPath: './assets/avatar.glb' }
   */
  constructor(parentGroup, options = {}) {
    this.parent = parentGroup;
    this.useCustomGLB = options.useCustomGLB || false;
    this.glbPath = options.glbPath || './assets/avatar.glb';

    this.root = new THREE.Group();
    this.parent.add(this.root);

    // Choreography states: 'IDLE' | 'RUNNING' | 'WAVING'
    this.state = 'IDLE';
    this.elapsed = 0;

    // Start offset (behind the anchor point, just like running out from behind the sculpture)
    this.startOffsetZ = -0.35; 
    this.endOffsetZ = 0.05;
    this.runDuration = 1.6; // seconds to run forward

    // For external GLB Mixer
    this.mixer = null;
    this.actions = {};

    if (this.useCustomGLB) {
      this._loadGLBAvatar();
    } else {
      this._buildProceduralLowPolyAvatar();
    }
  }

  /**
   * Builds a stylized low-poly character matching the video:
   * Blue hoodie, tan/brown pants, white shoes, beard, glasses, articulated limbs.
   */
  _buildProceduralLowPolyAvatar() {
    this.character = new THREE.Group();
    // Scale to miniature size (~18cm tall in real-world AR meters)
    this.character.scale.set(0.18, 0.18, 0.18);
    this.root.add(this.character);

    const matSkin = new THREE.MeshStandardMaterial({ color: 0xebb898, flatShading: true, roughness: 0.6 });
    const matHair = new THREE.MeshStandardMaterial({ color: 0x3d2314, flatShading: true, roughness: 0.8 });
    const matHoodie = new THREE.MeshStandardMaterial({ color: 0x5b82b5, flatShading: true, roughness: 0.7 });
    const matPants = new THREE.MeshStandardMaterial({ color: 0x7c5836, flatShading: true, roughness: 0.8 });
    const matShoes = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, flatShading: true, roughness: 0.5 });
    const matGlasses = new THREE.MeshStandardMaterial({ color: 0x1e293b, flatShading: true, metalness: 0.4 });

    // Torso (Blue Hoodie)
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.52, 0.24);
    this.torso = new THREE.Mesh(torsoGeo, matHoodie);
    this.torso.position.y = 0.72;
    this.character.add(this.torso);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.32, 0);
    this.torso.add(this.headGroup);

    const headGeo = new THREE.IcosahedronGeometry(0.22, 1);
    const headMesh = new THREE.Mesh(headGeo, matSkin);
    headMesh.position.y = 0.12;
    this.headGroup.add(headMesh);

    // Beard
    const beardGeo = new THREE.BoxGeometry(0.32, 0.18, 0.25);
    const beardMesh = new THREE.Mesh(beardGeo, matHair);
    beardMesh.position.set(0, 0.03, 0.08);
    this.headGroup.add(beardMesh);

    // Hair top
    const hairGeo = new THREE.BoxGeometry(0.38, 0.14, 0.38);
    const hairMesh = new THREE.Mesh(hairGeo, matHair);
    hairMesh.position.set(0, 0.28, -0.02);
    this.headGroup.add(hairMesh);

    // Glasses
    const glassesGeo = new THREE.BoxGeometry(0.34, 0.07, 0.05);
    const glassesMesh = new THREE.Mesh(glassesGeo, matGlasses);
    glassesMesh.position.set(0, 0.15, 0.20);
    this.headGroup.add(glassesMesh);

    // Left Arm (Hangs / swings while running)
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.27, 0.20, 0);
    this.torso.add(this.leftArmPivot);

    const armGeo = new THREE.BoxGeometry(0.12, 0.42, 0.12);
    const leftArm = new THREE.Mesh(armGeo, matHoodie);
    leftArm.position.y = -0.16;
    this.leftArmPivot.add(leftArm);

    const handGeo = new THREE.IcosahedronGeometry(0.065, 0);
    const leftHand = new THREE.Mesh(handGeo, matSkin);
    leftHand.position.y = -0.40;
    this.leftArmPivot.add(leftHand);

    // Right Arm (Swings while running, raises high to wave!)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.27, 0.20, 0);
    this.torso.add(this.rightArmPivot);

    const rightArm = new THREE.Mesh(armGeo, matHoodie);
    rightArm.position.y = -0.16;
    this.rightArmPivot.add(rightArm);

    const rightHand = new THREE.Mesh(handGeo, matSkin);
    rightHand.position.y = -0.40;
    this.rightArmPivot.add(rightHand);

    // Left Leg (Tan Pants + White Shoe)
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.11, -0.25, 0);
    this.torso.add(this.leftLegPivot);

    const legGeo = new THREE.BoxGeometry(0.15, 0.44, 0.15);
    const leftLeg = new THREE.Mesh(legGeo, matPants);
    leftLeg.position.y = -0.22;
    this.leftLegPivot.add(leftLeg);

    const shoeGeo = new THREE.BoxGeometry(0.16, 0.10, 0.24);
    const leftShoe = new THREE.Mesh(shoeGeo, matShoes);
    leftShoe.position.set(0, -0.44, 0.04);
    this.leftLegPivot.add(leftShoe);

    // Right Leg (Tan Pants + White Shoe)
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.11, -0.25, 0);
    this.torso.add(this.rightLegPivot);

    const rightLeg = new THREE.Mesh(legGeo, matPants);
    rightLeg.position.y = -0.22;
    this.rightLegPivot.add(rightLeg);

    const rightShoe = new THREE.Mesh(shoeGeo, matShoes);
    rightShoe.position.set(0, -0.44, 0.04);
    this.rightLegPivot.add(rightShoe);
  }

  /**
   * Optional: Loads a custom rigged GLB with 'Run' and 'Wave' animations
   */
  _loadGLBAvatar() {
    const loader = new GLTFLoader();
    loader.load(this.glbPath, (gltf) => {
      this.glbModel = gltf.scene;
      this.glbModel.scale.set(0.18, 0.18, 0.18);
      this.root.add(this.glbModel);

      this.mixer = new THREE.AnimationMixer(this.glbModel);
      gltf.animations.forEach((clip) => {
        this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
      });
    });
  }

  /**
   * Triggers or restarts the Run -> Stop -> Wave sequence
   */
  playSequence() {
    this.state = 'RUNNING';
    this.elapsed = 0;
    this.root.position.set(0, 0, this.startOffsetZ);
    // Slight angle as he runs out from the left/back toward the front right
    this.root.rotation.set(0, 0.25, 0);

    if (this.useCustomGLB && this.actions['run']) {
      Object.values(this.actions).forEach(a => a.stop());
      this.actions['run'].play();
    }
  }

  /**
   * Call every frame with delta time in seconds
   */
  update(dt) {
    if (this.state === 'IDLE') return;
    this.elapsed += dt;

    if (this.mixer) this.mixer.update(dt);

    // PHASE 1: RUN FORWARD
    if (this.state === 'RUNNING') {
      const progress = Math.min(this.elapsed / this.runDuration, 1.0);
      
      // Interpolate Z position forward and slight X arc
      this.root.position.z = THREE.MathUtils.lerp(this.startOffsetZ, this.endOffsetZ, progress);
      this.root.position.x = THREE.MathUtils.lerp(-0.12, 0.06, progress);

      if (!this.useCustomGLB && this.character) {
        const runCycle = this.elapsed * 16;
        // Bob torso up and down
        this.torso.position.y = 0.72 + Math.abs(Math.sin(runCycle)) * 0.06;
        // Lean slightly forward while running
        this.torso.rotation.x = 0.18;

        // Swing legs opposite to each other
        this.leftLegPivot.rotation.x = Math.sin(runCycle) * 0.8;
        this.rightLegPivot.rotation.x = -Math.sin(runCycle) * 0.8;

        // Swing arms opposite to legs
        this.leftArmPivot.rotation.x = -Math.sin(runCycle) * 0.7;
        this.rightArmPivot.rotation.x = Math.sin(runCycle) * 0.7;
        this.rightArmPivot.rotation.z = 0;
      }

      if (progress >= 1.0) {
        this.state = 'WAVING';
        this.waveElapsed = 0;

        if (this.useCustomGLB && this.actions['wave']) {
          if (this.actions['run']) this.actions['run'].fadeOut(0.2);
          this.actions['wave'].reset().fadeIn(0.2).play();
        }
      }
    }

    // PHASE 2: STOP, TURN TO CAMERA, AND WAVE
    else if (this.state === 'WAVING') {
      this.waveElapsed += dt;

      // Smoothly turn body to face the camera directly
      this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, -0.15, dt * 6);

      if (!this.useCustomGLB && this.character) {
        // Settle torso upright with gentle breathing
        this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0, dt * 8);
        this.torso.position.y = 0.72 + Math.sin(this.waveElapsed * 3) * 0.015;

        // Settle legs to standing posture
        this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, dt * 10);
        this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, dt * 10);
        this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, dt * 10);

        // Raise right arm and wave side-to-side
        this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, Math.PI * 0.85, dt * 10);
        this.rightArmPivot.rotation.z = 0.25 + Math.sin(this.waveElapsed * 12) * 0.35;

        // Friendly head tilt
        this.headGroup.rotation.z = Math.sin(this.waveElapsed * 4) * 0.08;
      }
    }
  }
}
