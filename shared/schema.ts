import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: integer("expire", { mode: "timestamp_ms" }).notNull(),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  spotifyConnected: integer("spotify_connected", { mode: "boolean" }).default(false),
  tidalConnected: integer("tidal_connected", { mode: "boolean" }).default(false),
  spotifyAccessToken: text("spotify_access_token"),
  spotifyRefreshToken: text("spotify_refresh_token"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
});

// Transfer history table
export const transfers = sqliteTable("transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  spotifyPlaylistId: text("spotify_playlist_id").notNull(),
  spotifyPlaylistName: text("spotify_playlist_name").notNull(),
  tidalPlaylistId: text("tidal_playlist_id"),
  tidalPlaylistName: text("tidal_playlist_name"),
  status: text("status").notNull(), // 'pending', 'in-progress', 'completed', 'failed'
  totalTracks: integer("total_tracks").notNull(),
  successfulTracks: integer("successful_tracks").default(0),
  partialTracks: integer("partial_tracks").default(0),
  failedTracks: integer("failed_tracks").default(0),
  progressData: text("progress_data"),
  resultData: text("result_data"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
});

// Track matching results for detailed reporting
export const trackMatches = sqliteTable("track_matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transferId: integer("transfer_id").notNull().references(() => transfers.id),
  spotifyTrackId: text("spotify_track_id").notNull(),
  spotifyTrackName: text("spotify_track_name").notNull(),
  spotifyArtistName: text("spotify_artist_name").notNull(),
  tidalTrackId: text("tidal_track_id"),
  tidalTrackName: text("tidal_track_name"),
  tidalArtistName: text("tidal_artist_name"),
  matchConfidence: integer("match_confidence"), // 0-100
  matchStatus: text("match_status").notNull(), // 'success', 'partial', 'failed'
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transfers: many(transfers),
}));

export const transfersRelations = relations(transfers, ({ one, many }) => ({
  user: one(users, {
    fields: [transfers.userId],
    references: [users.id],
  }),
  trackMatches: many(trackMatches),
}));

export const trackMatchesRelations = relations(trackMatches, ({ one }) => ({
  transfer: one(transfers, {
    fields: [trackMatches.transferId],
    references: [transfers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertTransferSchema = createInsertSchema(transfers)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    progressData: z.any().optional(),
    resultData: z.any().optional(),
  });

export const insertTrackMatchSchema = createInsertSchema(trackMatches).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTrackMatch = z.infer<typeof insertTrackMatchSchema>;
export type TrackMatch = typeof trackMatches.$inferSelect;
