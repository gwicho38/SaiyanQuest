import { Vector3, Box3 } from 'three';

export interface Collidable {
  position: Vector3;
  size: Vector3;
  id: string;
  type: 'player' | 'enemy' | 'projectile' | 'obstacle' | 'item';
}

export class CollisionSystem {
  private static instance: CollisionSystem;
  private collidables: Map<string, Collidable> = new Map();

  static getInstance(): CollisionSystem {
    if (!this.instance) {
      this.instance = new CollisionSystem();
    }
    return this.instance;
  }

  addCollidable(collidable: Collidable): void {
    this.collidables.set(collidable.id, collidable);
  }

  removeCollidable(id: string): void {
    this.collidables.delete(id);
  }

  updateCollidable(id: string, position: Vector3): void {
    const collidable = this.collidables.get(id);
    if (collidable) {
      collidable.position = position;
    }
  }

  checkCollision(id1: string, id2: string): boolean {
    const obj1 = this.collidables.get(id1);
    const obj2 = this.collidables.get(id2);
    
    if (!obj1 || !obj2) return false;
    
    return this.isAABBColliding(obj1, obj2);
  }

  checkCollisionsForObject(id: string, excludeTypes: string[] = []): Collidable[] {
    const obj = this.collidables.get(id);
    if (!obj) return [];
    
    const collisions: Collidable[] = [];
    
    for (const [otherId, other] of this.collidables) {
      if (otherId === id || excludeTypes.includes(other.type)) continue;
      
      if (this.isAABBColliding(obj, other)) {
        collisions.push(other);
      }
    }
    
    return collisions;
  }

  private isAABBColliding(obj1: Collidable, obj2: Collidable): boolean {
    const box1 = new Box3().setFromCenterAndSize(obj1.position, obj1.size);
    const box2 = new Box3().setFromCenterAndSize(obj2.position, obj2.size);
    
    return box1.intersectsBox(box2);
  }

  getDistance(id1: string, id2: string): number {
    const obj1 = this.collidables.get(id1);
    const obj2 = this.collidables.get(id2);
    
    if (!obj1 || !obj2) return Infinity;
    
    return obj1.position.distanceTo(obj2.position);
  }

  getObjectsInRange(id: string, range: number, filterType?: string): Collidable[] {
    const obj = this.collidables.get(id);
    if (!obj) return [];
    
    const inRange: Collidable[] = [];
    
    for (const [otherId, other] of this.collidables) {
      if (otherId === id) continue;
      if (filterType && other.type !== filterType) continue;
      
      const distance = obj.position.distanceTo(other.position);
      if (distance <= range) {
        inRange.push(other);
      }
    }
    
    return inRange;
  }

  clear(): void {
    this.collidables.clear();
  }
}
