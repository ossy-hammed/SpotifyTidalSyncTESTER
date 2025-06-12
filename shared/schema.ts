import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  spotifyConnected: boolean("spotify_connected").default(false),
  tidalConnected: boolean("tidal_connected").default(false),
  spotifyAccessToken: text("spotify_access_token"),
  spotifyRefreshToken: text("spotify_refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transfer history table
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  spotifyPlaylistId: varchar("spotify_playlist_id").notNull(),
  spotifyPlaylistName: varchar("spotify_playlist_name").notNull(),
  tidalPlaylistId: varchar("tidal_playlist_id"),
  tidalPlaylistName: varchar("tidal_playlist_name"),
  status: varchar("status").notNull(), // 'pending', 'in-progress', 'completed', 'failed'
  totalTracks: integer("total_tracks").notNull(),
  successfulTracks: integer("successful_tracks").default(0),
  partialTracks: integer("partial_tracks").default(0),
  failedTracks: integer("failed_tracks").default(0),
  progressData: jsonb("progress_data"), // Store real-time progress
  resultData: jsonb("result_data"), // Store detailed results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track matching results for detailed reporting
export const trackMatches = pgTable("track_matches", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => transfers.id),
  spotifyTrackId: varchar("spotify_track_id").notNull(),
  spotifyTrackName: varchar("spotify_track_name").notNull(),
  spotifyArtistName: varchar("spotify_artist_name").notNull(),
  tidalTrackId: varchar("tidal_track_id"),
  tidalTrackName: varchar("tidal_track_name"),
  tidalArtistName: varchar("tidal_artist_name"),
  matchConfidence: integer("match_confidence"), // 0-100
  matchStatus: varchar("match_status").notNull(), // 'success', 'partial', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
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
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
