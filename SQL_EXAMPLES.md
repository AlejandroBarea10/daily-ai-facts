// Script para insertar datos de efemérides en Supabase
// Ejecutar en la consola de Supabase SQL Editor

const exampleData = [
  {
    day: 6,
    month: 1,
    year: 2007,
    title: "Steve Jobs introduces the iPhone",
    description:
      "At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing and ushering in the smartphone era.",
    category: "TECH",
  },
  {
    day: 4,
    month: 7,
    year: 1976,
    title: "United States Bicentennial",
    description:
      "The United States celebrates its 200th anniversary of independence. Fireworks light up cities across the nation.",
    category: "COMPUTING",
  },
  {
    day: 25,
    month: 12,
    year: 2024,
    title: "Christmas",
    description:
      "Celebrate the winter holiday with loved ones. A day of tradition, joy, and connection.",
    category: "AI",
  },
];

/**
 * INSERT statements para ejecutar en Supabase SQL Editor
 */

// Opción 1: Insertar uno por uno
INSERT INTO ephemerides (day, month, year, title, description, category)
VALUES (6, 1, 2007, 'Steve Jobs introduces the iPhone', 'At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing and ushering in the smartphone era.', 'TECH');

INSERT INTO ephemerides (day, month, year, title, description, category)
VALUES (4, 7, 1976, 'United States Bicentennial', 'The United States celebrates its 200th anniversary of independence. Fireworks light up cities across the nation.', 'COMPUTING');

INSERT INTO ephemerides (day, month, year, title, description, category)
VALUES (25, 12, 2024, 'Christmas', 'Celebrate the winter holiday with loved ones. A day of tradition, joy, and connection.', 'AI');

// Opción 2: Insertar múltiples a la vez
INSERT INTO ephemerides (day, month, year, title, description, category) VALUES
  (6, 1, 2007, 'Steve Jobs introduces the iPhone', 'At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing and ushering in the smartphone era.', 'TECH'),
  (4, 7, 1976, 'United States Bicentennial', 'The United States celebrates its 200th anniversary of independence. Fireworks light up cities across the nation.', 'COMPUTING'),
  (25, 12, 2024, 'Christmas', 'Celebrate the winter holiday with loved ones. A day of tradition, joy, and connection.', 'AI');

// Verificar que se insertaron correctamente
SELECT * FROM ephemerides ORDER BY year DESC;
