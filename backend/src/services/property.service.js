
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

// =====================================================
// VALIDAR O IDENTIFICADOR
// =====================================================

function parseId(id) {
  const propertyId = Number(id);

  if (!Number.isSafeInteger(propertyId) || propertyId <= 0) {
    throw createError("Identificador do imóvel inválido.", 400);
  }

  return propertyId;
}

// =====================================================
// ATUALIZAR IMÓVEL
// =====================================================

export async function updateProperty(id, property) {
  const propertyId = parseId(id);

  validateProperty(property);

  const updated = await propertyRepository.update(propertyId, property);

  if (!updated) {
    throw createError("Imóvel não encontrado.", 404);
  }

  return updated;
}

// =====================================================
// EXCLUIR IMÓVEL
// =====================================================

export async function deleteProperty(id) {
  const propertyId = parseId(id);

  try {
    const deleted = await propertyRepository.remove(propertyId);

    if (!deleted) {
      throw createError("Imóvel não encontrado.", 404);
    }
  } catch (error) {
    // Violação de chave estrangeira: o imóvel já possui avaliações.
    if (error.code === "23503") {
      throw createError(
        "Este imóvel possui avaliações registradas e não pode ser excluído.",
        409
      );
    }

    throw error;
  }
}
