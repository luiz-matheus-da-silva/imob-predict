
import * as propertyService from "../services/property.service.js";

// =====================================================
// GET /api/properties
// =====================================================

export async function getAll(request, response, next) {
  try {
    const properties = await propertyService.getAllProperties();

    return response.status(200).json({
      data: properties
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// GET /api/properties/:id
// =====================================================

export async function getById(request, response, next) {
  try {
    const property = await propertyService.getPropertyById(
      request.params.id
    );

    return response.status(200).json({
      data: property
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// POST /api/properties
// =====================================================

export async function create(request, response, next) {
  try {
    const property = await propertyService.createProperty(request.body);

    return response.status(201).json({
      message: "Imóvel cadastrado com sucesso.",
      data: property
    });
  } catch (error) {
    next(error);
  }
}
