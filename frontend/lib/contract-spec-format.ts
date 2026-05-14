/** Pretty-print Soroban contract spec `type_` values (string or nested object). */
export function formatSpecType(type_: unknown): string {
  if (type_ == null) return "—";
  if (typeof type_ === "string") return type_;
  if (typeof type_ !== "object" || Array.isArray(type_)) {
    return JSON.stringify(type_);
  }
  const o = type_ as Record<string, unknown>;
  if ("option" in o && o.option && typeof o.option === "object") {
    const inner = (o.option as { value_type?: unknown }).value_type;
    return `Option<${formatSpecType(inner)}>`;
  }
  if ("vec" in o && o.vec && typeof o.vec === "object") {
    const inner = (o.vec as { element_type?: unknown }).element_type;
    return `Vec<${formatSpecType(inner)}>`;
  }
  if ("map" in o && o.map && typeof o.map === "object") {
    const m = o.map as { key_type?: unknown; value_type?: unknown };
    return `Map<${formatSpecType(m.key_type)}, ${formatSpecType(m.value_type)}>`;
  }
  if ("tuple" in o && Array.isArray((o as { tuple?: unknown }).tuple)) {
    const els = (o as { tuple: unknown[] }).tuple.map(formatSpecType);
    return `(${els.join(", ")})`;
  }
  return JSON.stringify(type_);
}
