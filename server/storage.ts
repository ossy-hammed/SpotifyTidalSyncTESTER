import {
  users,
  transfers,
  trackMatches,
  type User,
  type UpsertUser,
  type Transfer,
  type InsertTransfer,
  type TrackMatch,
  type InsertTrackMatch,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Transfer operations
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfer(id: number): Promise<Transfer | undefined>;
  updateTransfer(id: number, updates: Partial<Transfer>): Promise<Transfer>;
  getUserTransfers(userId: string): Promise<Transfer[]>;
  
  // Track match operations
  createTrackMatch(trackMatch: InsertTrackMatch): Promise<TrackMatch>;
  getTransferMatches(transferId: number): Promise<TrackMatch[]>;
  
  // Connection status updates
  updateSpotifyConnection(userId: string, accessToken: string, refreshToken: string): Promise<void>;
  updateTidalConnection(userId: string, connected: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transfer operations
  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [newTransfer] = await db
      .insert(transfers)
      .values({
        ...transfer,
        progressData: transfer.progressData ? JSON.stringify(transfer.progressData) : null,
        resultData: transfer.resultData ? JSON.stringify(transfer.resultData) : null,
      })
      .returning();
    return newTransfer;
  }

  async getTransfer(id: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    if (transfer && typeof transfer.progressData === 'string') {
      transfer.progressData = JSON.parse(transfer.progressData);
    }
    if (transfer && typeof transfer.resultData === 'string') {
      transfer.resultData = JSON.parse(transfer.resultData);
    }
    return transfer;
  }

  async updateTransfer(id: number, updates: Partial<Transfer>): Promise<Transfer> {
    const [updatedTransfer] = await db
      .update(transfers)
      .set({
        ...updates,
        progressData: updates.progressData ? JSON.stringify(updates.progressData) : undefined,
        resultData: updates.resultData ? JSON.stringify(updates.resultData) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(transfers.id, id))
      .returning();
    return updatedTransfer;
  }

  async getUserTransfers(userId: string): Promise<Transfer[]> {
    const rows = await db
      .select()
      .from(transfers)
      .where(eq(transfers.userId, userId))
      .orderBy(desc(transfers.createdAt));
    return rows.map((t: any) => ({
      ...t,
      progressData: t.progressData ? JSON.parse(t.progressData) : null,
      resultData: t.resultData ? JSON.parse(t.resultData) : null,
    }));
  }

  // Track match operations
  async createTrackMatch(trackMatch: InsertTrackMatch): Promise<TrackMatch> {
    const [newMatch] = await db
      .insert(trackMatches)
      .values(trackMatch)
      .returning();
    return newMatch;
  }

  async getTransferMatches(transferId: number): Promise<TrackMatch[]> {
    return await db
      .select()
      .from(trackMatches)
      .where(eq(trackMatches.transferId, transferId));
  }

  // Connection status updates
  async updateSpotifyConnection(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    await db
      .update(users)
      .set({
        spotifyConnected: true,
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateTidalConnection(userId: string, connected: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        tidalConnected: connected,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
