import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  username: text('username').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const routes = sqliteTable('routes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  routeNumber: text('route_number').notNull(),
  country: text('country').notNull(),
  description: text('description'),
  totalLength: real('total_length'),
  startPoint: text('start_point'),
  endPoint: text('end_point'),
});

export const journeys = sqliteTable('journeys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  routeId: integer('route_id').references(() => routes.id),
  title: text('title').notNull(),
  description: text('description'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('planning'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  altitude: real('altitude'),
  takenAt: integer('taken_at', { mode: 'timestamp' }),
  locationName: text('location_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const journeyPhotos = sqliteTable('journey_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  journeyId: integer('journey_id').notNull().references(() => journeys.id),
  photoId: integer('photo_id').notNull().references(() => photos.id),
  orderIndex: integer('order_index').default(0),
  caption: text('caption'),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  journeys: many(journeys),
  photos: many(photos),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  journeys: many(journeys),
}));

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  user: one(users, { fields: [journeys.userId], references: [users.id] }),
  route: one(routes, { fields: [journeys.routeId], references: [routes.id] }),
  journeyPhotos: many(journeyPhotos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  user: one(users, { fields: [photos.userId], references: [users.id] }),
  journeyPhotos: many(journeyPhotos),
}));

export const journeyPhotosRelations = relations(journeyPhotos, ({ one }) => ({
  journey: one(journeys, { fields: [journeyPhotos.journeyId], references: [journeys.id] }),
  photo: one(photos, { fields: [journeyPhotos.photoId], references: [photos.id] }),
}));
