
import { database } from "../config/database.js";

// =====================================================
// BUSCAR TODOS OS IMÓVEIS
// =====================================================

export async function findAll() {
  const query = `
    SELECT
      id,
      area,
      bedrooms,
      bathrooms,
      age,
      parking_spaces AS "parkingSpaces",
      neighborhood,
      condition,
      has_pool AS "hasPool",
      created_at AS "createdAt"
    FROM properties
    ORDER BY created_at DESC;
  `;

  const result = await database.query(query);

  return result.rows;
}

// =====================================================
// BUSCAR UM IMÓVEL PELO ID
// =====================================================

export async function findById(id) {
  const query = `
    SELECT
      id,
      area,
      bedrooms,
      bathrooms,
      age,
      parking_spaces AS "parkingSpaces",
      neighborhood,
      condition,
      has_pool AS "hasPool",
      created_at AS "createdAt"
    FROM properties
    WHERE id = $1;
  `;

  const result = await database.query(query, [id]);

  return result.rows[0] ?? null;
}

// =====================================================
// CADASTRAR UM IMÓVEL
// =====================================================

export async function create(property) {
  const query = `
    INSERT INTO properties (
      area,
      bedrooms,
      bathrooms,
      age,
      parking_spaces,
      neighborhood,
      condition,
      has_pool
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      area,
      bedrooms,
      bathrooms,
      age,
      parking_spaces AS "parkingSpaces",
      neighborhood,
      condition,
      has_pool AS "hasPool",
      created_at AS "createdAt";
  `;

  const values = [
    property.area,
    property.bedrooms,
    property.bathrooms,
    property.age,
    property.parkingSpaces,
    property.neighborhood,
    property.condition,
    property.hasPool
  ];

  const result = await database.query(query, values);

  return result.rows[0];
}
