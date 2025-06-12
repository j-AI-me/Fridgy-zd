// Datos mock para cuando la base de datos no funciona correctamente

// Análisis mock
export const mockAnalyses = [
  {
    id: "mock-analysis-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ayer
    ingredients: ["Tomate", "Cebolla", "Pimiento", "Ajo", "Aceite de oliva"],
    image_url: "/placeholder-ao0xa.png",
    recipes: [
      {
        id: "mock-recipe-1",
        title: "Salsa de tomate casera",
        description: "Una deliciosa salsa de tomate casera para pasta o pizza",
        available_ingredients: ["Tomate", "Cebolla", "Ajo", "Aceite de oliva"],
        additional_ingredients: ["Sal", "Pimienta", "Albahaca"],
        preparation_steps: [
          "Picar la cebolla y el ajo finamente",
          "Sofreír en aceite de oliva hasta que estén transparentes",
          "Añadir los tomates cortados en cubos",
          "Cocinar a fuego lento durante 20 minutos",
          "Sazonar con sal, pimienta y albahaca al gusto",
        ],
      },
      {
        id: "mock-recipe-2",
        title: "Pimientos asados",
        description: "Pimientos asados con un toque de ajo",
        available_ingredients: ["Pimiento", "Ajo", "Aceite de oliva"],
        additional_ingredients: ["Sal", "Pimienta"],
        preparation_steps: [
          "Cortar los pimientos en tiras",
          "Picar el ajo finamente",
          "Mezclar todo con aceite de oliva, sal y pimienta",
          "Hornear a 200°C durante 20 minutos",
        ],
      },
    ],
  },
  {
    id: "mock-analysis-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // Hace 2 días
    ingredients: ["Huevos", "Leche", "Queso", "Jamón", "Pan"],
    image_url: "/placeholder.svg?height=300&width=400&query=refrigerator+with+eggs+and+milk",
    recipes: [
      {
        id: "mock-recipe-3",
        title: "Tostadas francesas",
        description: "Deliciosas tostadas francesas para el desayuno",
        available_ingredients: ["Huevos", "Leche", "Pan"],
        additional_ingredients: ["Canela", "Azúcar", "Mantequilla", "Sirope de arce"],
        preparation_steps: [
          "Batir los huevos con la leche, canela y azúcar",
          "Remojar las rebanadas de pan en la mezcla",
          "Cocinar en una sartén con mantequilla hasta que estén doradas por ambos lados",
          "Servir con sirope de arce",
        ],
      },
      {
        id: "mock-recipe-4",
        title: "Sandwich de jamón y queso",
        description: "Un clásico sandwich de jamón y queso",
        available_ingredients: ["Pan", "Jamón", "Queso"],
        additional_ingredients: ["Mantequilla", "Mostaza"],
        preparation_steps: [
          "Untar mantequilla en las rebanadas de pan",
          "Añadir jamón y queso",
          "Tostar en una sartén o sandwichera hasta que el queso se derrita",
        ],
      },
    ],
  },
]

// Recetas favoritas mock
export const mockFavorites = [
  {
    id: "mock-favorite-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    recipe: {
      id: "mock-recipe-1",
      title: "Salsa de tomate casera",
      description: "Una deliciosa salsa de tomate casera para pasta o pizza",
      available_ingredients: ["Tomate", "Cebolla", "Ajo", "Aceite de oliva"],
      additional_ingredients: ["Sal", "Pimienta", "Albahaca"],
      preparation_steps: [
        "Picar la cebolla y el ajo finamente",
        "Sofreír en aceite de oliva hasta que estén transparentes",
        "Añadir los tomates cortados en cubos",
        "Cocinar a fuego lento durante 20 minutos",
        "Sazonar con sal, pimienta y albahaca al gusto",
      ],
    },
  },
  {
    id: "mock-favorite-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    recipe: {
      id: "mock-recipe-3",
      title: "Tostadas francesas",
      description: "Deliciosas tostadas francesas para el desayuno",
      available_ingredients: ["Huevos", "Leche", "Pan"],
      additional_ingredients: ["Canela", "Azúcar", "Mantequilla", "Sirope de arce"],
      preparation_steps: [
        "Batir los huevos con la leche, canela y azúcar",
        "Remojar las rebanadas de pan en la mezcla",
        "Cocinar en una sartén con mantequilla hasta que estén doradas por ambos lados",
        "Servir con sirope de arce",
      ],
    },
  },
]

// Listas de compra mock
export const mockShoppingLists = [
  {
    id: "mock-list-1",
    name: "Lista del supermercado",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    items: [
      { id: "mock-item-1", name: "Leche", completed: false },
      { id: "mock-item-2", name: "Huevos", completed: true },
      { id: "mock-item-3", name: "Pan", completed: false },
      { id: "mock-item-4", name: "Queso", completed: false },
    ],
  },
  {
    id: "mock-list-2",
    name: "Fiesta del fin de semana",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    items: [
      { id: "mock-item-5", name: "Patatas fritas", completed: false },
      { id: "mock-item-6", name: "Refrescos", completed: false },
      { id: "mock-item-7", name: "Hielo", completed: false },
    ],
  },
]

// Notificaciones mock
export const mockNotifications = [
  {
    id: "mock-notif-1",
    title: "Nueva receta recomendada",
    message: "Hemos encontrado una nueva receta que podría gustarte: Pasta Carbonara",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Hace 30 minutos
    read: false,
  },
  {
    id: "mock-notif-2",
    title: "Recordatorio de lista de compra",
    message: "No olvides comprar los ingredientes de tu lista 'Lista del supermercado'",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Hace 2 horas
    read: true,
  },
  {
    id: "mock-notif-3",
    title: "Consejo de cocina",
    message: "Prueba a añadir un poco de vinagre al agua cuando hiervas huevos para que sean más fáciles de pelar",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Hace 1 día
    read: true,
  },
]
