/// app/db/schema.ts

import { pgTable, text, integer, uuid, jsonb, date } from 'drizzle-orm/pg-core';
import { sql } from "drizzle-orm";

export const ambulancesTable = pgTable('ambulances', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_id: text('user_id').notNull(), // The ambulance's user id in clerk
  numero_plaque: text('numero_plaque'),
  nom_conducteur: text('nom_conducteur'),
  etat: text('etat'), // En route, Disponible, Maintenance
  capacite: integer('capacite'), // Nombre de patient 
});

export const hopitauxTable = pgTable('hopitaux', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_id: text('user_id').notNull(), // The "hopital"'s user id in clerk
  nom: text('nom'),
  adresse: text('adresse'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  capacite_totale: integer('capacite_totale'),
  lits_disponibles: integer('lits_disponibles'),
  numero_contact: text('numero_contact'),
});

export const medecinsTable = pgTable('medecins', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  nom: text('nom'),
  specialite: text('specialite'),
  hopital_id: uuid('hopital_id').notNull().references(() => hopitauxTable.id),
  numero_contact: text('numero_contact').notNull(),
});

export const chambresTable = pgTable('chambres', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  numero: text('numero').notNull(),
  etage: text('etage').notNull(),
  hopital_id: uuid('hopital_id').notNull().references(() => hopitauxTable.id),
  capacite: integer('capacite').notNull(),
  lits_disponibles: integer('lits_disponibles').notNull(),
});

export const patientsTable = pgTable('patients', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  nom: text('nom').notNull(),
  cin: text('cin').notNull(),
  age: integer('age').notNull(),
  groupe_sanguin: text('groupe_sanguin').notNull(),
  numero_contact: text('numero_contact').notNull(),
  adresse: text('adresse').notNull(),
  chambre_id: uuid('chambre_id').references(() => chambresTable.id), // can be NULL
  hopital_id: uuid('hopital_id').references(() => hopitauxTable.id), // can be NULL
  ambulance_id: uuid('ambulance_id').references(() => ambulancesTable.id), // can be NULL
  dossier_medical: jsonb('dossier_medical'),
});

export const equipementsMedicauxTable = pgTable('equipements_medicaux', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  nom: text('nom').notNull(),
  description: text('description'),
  quantite_totale: integer('quantite_totale').notNull(),
  quantite_disponible: integer('quantite_disponible').notNull(),
  hopital_id: uuid('hopital_id').notNull().references(() => hopitauxTable.id),
});

export const medicamentsTable = pgTable('medicaments', {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  nom: text('nom').notNull(),
  description: text('description'),
  quantite: integer('quantite_disponible').notNull(),
  date_expiration: date('date_expiration').notNull(),
  hopital_id: uuid('hopital_id').notNull().references(() => hopitauxTable.id),
});

export const blocksTable = pgTable('blocks', {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey()
})