import os
import logging

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = float(os.getenv("NEEDLE_CONFIDENCE_THRESHOLD", "0.35"))

MOVEMENT_TOOL = {
    "name": "register_movement",
    "description": (
        "Registrar un movimiento de stock de un producto de bodega. "
        "Extraer la cantidad de unidades mencionada y si es una entrada "
        "(agregar, recibir, reponer, ingresar, subir, entran) o una salida "
        "(quitar, retirar, despachar, vender, sacar, bajar, salen)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "quantity": {
                "type": "integer",
                "minimum": 1,
                "maximum": 1000000,
                "description": "Cantidad de unidades dicha por el operario. Puede venir como numeral ('20') o en palabras ('veinte').",
            },
            "type": {
                "type": "string",
                "enum": ["in", "out"],
                "description": "'in' si es entrada o agregar stock, 'out' si es salida o quitar stock.",
            },
        },
        "required": ["quantity", "type"],
    },
}

PRODUCT_TOOL = {
    "name": "describe_product",
    "description": (
        "Describir un producto de bodega a partir de la frase del operario. "
        "Extraer nombre, marca, categoría, presentación y unidad de medida "
        "solo si aparecen en la frase. No inventar valores."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "maxLength": 255, "description": "Nombre del producto, p.ej. 'Aceite de oliva extra virgen'."},
            "brand": {"type": "string", "maxLength": 255, "description": "Marca, p.ej. 'La Española'."},
            "category": {"type": "string", "maxLength": 255, "description": "Categoría, p.ej. 'Abarrotes', 'Lácteos'."},
            "presentation": {"type": "string", "maxLength": 255, "description": "Presentación, p.ej. 'Botella 500ml'."},
            "unit": {"type": "string", "maxLength": 50, "description": "Unidad de medida, p.ej. 'Unidad', 'Caja', 'Bolsa'."},
        },
        "required": [],
    },
}

_agent = None


def get_agent():
    global _agent
    if _agent is None:
        import needle

        _agent = needle.Needle(
            tools=[MOVEMENT_TOOL, PRODUCT_TOOL],
            system="locale: es-AR; user: operario de bodega que habla español; el operario dicta cantidades y descripciones de productos en español",
        )
        logger.info("Needle engine initialized")
    return _agent


def warmup():
    """Carga el motor en el lifespan para que la primera request sea instantánea."""
    try:
        get_agent()
    except Exception as e:
        logger.warning(f"Needle warmup failed (se reintentará en la primera request): {e}")


def _call(text: str, tool_name: str, max_new_tokens: int = 128) -> dict | None:
    global _agent
    try:
        agent = get_agent()
        agent.reset()
        response = agent.complete(text, max_new_tokens=max_new_tokens)
    except Exception as e:
        logger.warning(f"Needle complete failed, recreating engine: {e}")
        _agent = None
        agent = get_agent()
        agent.reset()
        response = agent.complete(text, max_new_tokens=max_new_tokens)

    if not response or response.get("type") != "call":
        return None

    calls = response.get("function_calls") or []
    if not calls:
        return None

    # El modelo puede emitir varias llamadas; quedarse con la más completa
    candidates = [c for c in calls if c.get("name") == tool_name]
    if not candidates:
        return None
    best = max(candidates, key=lambda c: len(c.get("arguments") or {}))

    confidence = float(response.get("confidence", 0.0))
    if confidence < CONFIDENCE_THRESHOLD:
        return None

    args = best.get("arguments") or {}
    args["confidence"] = round(confidence, 4)
    return args


def parse_movement(text: str) -> dict | None:
    return _call(text, "register_movement")


def parse_product(text: str) -> dict | None:
    return _call(text, "describe_product")