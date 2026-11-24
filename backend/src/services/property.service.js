
import * as propertyRepository from "../repositories/property.repository.js";

// =====================================================
// ERRO PERSONALIZADO
// =====================================================

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

// =====================================================
// VALIDAR OS DADOS DO IMÓVEL
// =====================================================

function validateProperty(property) {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    throw createError("Os dados do imóvel são obrigatórios.", 400);
  }

  const numericFields = [
    "area",
    "bedrooms",
    "bathrooms",
    "age",
    "parkingSpaces"
  ];

  for (const field of numericFields) {
    const value = property[field];

    if (value === undefined || value === null || value === "") {
      throw createError(`O campo ${field} é obrigatório.`, 400);
    }

    if (!Number.isFinite(value)) {
      throw createError(`O campo ${field} deve ser numérico.`, 400);
    }

    if (field === "area" && value <= 0) {
      throw createError("A área deve ser maior que zero.", 400);
    }

    if (field !== "area" && (!Number.isInteger(value) || value < 0)) {
      throw createError(
        `O campo ${field} deve ser um número inteiro não negativo.`,
        400
      );
    }
  }

  const textFields = ["neighborhood", "condition"];

  for (const field of textFields) {
    if (
      typeof property[field] !== "string" ||
      property[field].trim() === ""
    ) {
      throw createError(`O campo ${field} é obrigatório.`, 400);
    }
  }

  if (typeof property.hasPool !== "boolean") {
    throw createError("O campo hasPool deve ser verdadeiro ou falso.", 400);
  }
}

// =====================================================
// LISTAR IMÓVEIS
// =====================================================

export async function getAllProperties() {
  return propertyRepository.findAll();
}

// =====================================================
// BUSCAR IMÓVEL POR ID
// =====================================================

export async function getPropertyById(id) {
  const propertyId = Number(id);

  if (!Number.isSafeInteger(propertyId) || propertyId <= 0) {
    throw createError("Identificador do imóvel inválido.", 400);
  }

  const property = await propertyRepository.findById(propertyId);

  if (!property) {
    throw createError("Imóvel não encontrado.", 404);
  }

  return property;
}

// =====================================================
// CADASTRAR IMÓVEL
// =====================================================

export async function createProperty(property) {
  validateProperty(property);

  return propertyRepository.create(property);
}
