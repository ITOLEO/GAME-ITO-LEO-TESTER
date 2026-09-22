/**
 * WaterSystem - Animated Stylized River & Bridge Architecture.
 * Features procedural ripple animation, shoreline foam lines, and physical bridge colliders.
 */

import * as THREE from "three";
import { MaterialFactory } from "./materialFactory";
import { CollisionSystem } from "../controls/collisionSystem";

export class WaterSystem {
  private materials = MaterialFactory.getInstance();
  private riverMesh!: THREE.Mesh;
  private foamMesh!: THREE.Mesh;

  public buildWaterAndBridge(
    scene: THREE.Scene,
    collisionSystem: CollisionSystem
  ): { update: (time: number) => void } {
    const waterGroup = new THREE.Group();

    // 1. Riverbed Geometry (underwater basin)
    const bedGeo = new THREE.PlaneGeometry(280, 16, 32, 4);
    bedGeo.rotateX(-Math.PI / 2);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, // Deep aquatic silt
      roughness: 0.85,
    });
    const riverbed = new THREE.Mesh(bedGeo, bedMat);
    riverbed.position.set(18, -0.65, 0);
    riverbed.rotation.y = 0.2;
    waterGroup.add(riverbed);

    // 2. Translucent Animated Water Surface
    const riverGeo = new THREE.PlaneGeometry(280, 14, 64, 8);
    riverGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant anime cyan-blue
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      normalMap: this.materials.getWaterNormalTexture(),
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.78,
    });
    this.riverMesh = new THREE.Mesh(riverGeo, waterMat);
    this.riverMesh.position.set(18, -0.2, 0);
    this.riverMesh.rotation.y = 0.2;
    waterGroup.add(this.riverMesh);

    // 3. Stylized Shoreline Foam Edges
    const foamGeo = new THREE.PlaneGeometry(280, 0.6);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    });

    for (const offsetZ of [-6.8, 6.8]) {
      const foam = new THREE.Mesh(foamGeo, foamMat);
      foam.position.set(18, -0.15, offsetZ);
      foam.rotation.y = 0.2;
      waterGroup.add(foam);
    }

    // 4. Upgraded Stylized Wooden & Stone Arch Bridge at (18, 0, 0)
    this.buildArchedBridge(waterGroup, collisionSystem);

    scene.add(waterGroup);

    return {
      update: (time: number) => {
        // Animate water normal map UV drift
        if (waterMat.normalMap) {
          waterMat.normalMap.offset.x = time * 0.04;
          waterMat.normalMap.offset.y = time * 0.02;
        }
        // Subtle vertical undulating bob
        this.riverMesh.position.y = -0.2 + Math.sin(time * 1.5) * 0.04;
      },
    };
  }

  private buildArchedBridge(parent: THREE.Group, collisionSystem: CollisionSystem) {
    const bridge = new THREE.Group();
    bridge.position.set(18, 0.45, 0);
    bridge.rotation.y = 0.2;

    // Stone Abutments on riverbanks
    const abutmentMat = this.materials.getStoneWallMaterial();
    for (const ax of [-3.8, 3.8]) {
      const abutment = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 18), abutmentMat);
      abutment.position.set(ax, 0.2, 0);
      abutment.castShadow = true;
      bridge.add(abutment);
    }

    // Arched Wooden Planking Deck
    const deckMat = this.materials.getTimberMaterial();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.45, 18), deckMat);
    deck.position.y = 0.6;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridge.add(deck);

    // Cross-Braced Wooden Handrails
    const railMat = this.materials.getTimberMaterial();
    for (const rz of [-8.6, 8.6]) {
      const posts = 7;
      for (let p = 0; p < posts; p++) {
        const px = -3.2 + (p / (posts - 1)) * 6.4;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2), railMat);
        post.position.set(px, 1.2, rz);
        post.castShadow = true;
        bridge.add(post);
      }
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 0.15), railMat);
      topRail.position.set(0, 1.75, rz);
      bridge.add(topRail);
    }

    // Bridge Approach Stone Lanterns
    for (const lx of [-4.2, 4.2]) {
      for (const lz of [-9.2, 9.2]) {
        const lantern = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, 1.6, 6),
          this.materials.getStoneWallMaterial()
        );
        lantern.position.set(lx, 1.0, lz);
        lantern.castShadow = true;
        bridge.add(lantern);

        const flame = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.12),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        flame.position.set(lx, 1.9, lz);
        bridge.add(flame);
      }
    }

    parent.add(bridge);

    // Register bridge side rail colliders so player doesn't fall off sides into deep water inadvertently
    // Side rail 1
    collisionSystem.addBoxCollider("bridge_rail_left", 14, 0, -10, 22, 2.5, -8.2);
    // Side rail 2
    collisionSystem.addBoxCollider("bridge_rail_right", 14, 0, 8.2, 22, 2.5, 10);
  }
}
