import pool from "../config/database.js";

export const ensureSectionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sections (
      id SERIAL PRIMARY KEY,
      class_id UUID NOT NULL,
      section_name VARCHAR(100) NOT NULL,
      class_teacher VARCHAR(100),
      capacity INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT fk_sections_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,

      CONSTRAINT unique_section_per_class
        UNIQUE (class_id, section_name)
    )
  `);
};