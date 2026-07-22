const MAX_TIMEOUT_MS = 2_147_483_647;

export function categoriaActiva(categoria, ahora = Date.now()) {
  const activoDesde = Date.parse(categoria?.activoDesde || '');
  return !Number.isFinite(activoDesde) || ahora >= activoDesde;
}

export function categoriasActivas(data, ahora = Date.now()) {
  return (data?.categorias || []).filter(categoria => categoriaActiva(categoria, ahora));
}

export function categoriaDelProducto(producto, data) {
  const idBase = producto?.id?.split('__')[0];
  if (!idBase) return null;
  return (data?.categorias || []).find(categoria =>
    (categoria.productos || []).some(item => item.id === idBase)
  ) || null;
}

export function productoActivo(producto, data, ahora = Date.now()) {
  const categoria = categoriaDelProducto(producto, data);
  return Boolean(categoria && categoriaActiva(categoria, ahora));
}

export function productoDisponible(producto, data, ahora = Date.now()) {
  if (!productoActivo(producto, data, ahora)) return false;
  const categoria = categoriaDelProducto(producto, data);
  if (producto?.disponible !== false) return true;
  return Boolean(categoria?.disponibilidadProgramada && categoriaActiva(categoria, ahora));
}

export function removerProductosNoActivos(items, data, ahora = Date.now()) {
  const removidos = [];
  Object.entries(items || {}).forEach(([id, item]) => {
    if (!productoDisponible(item?.producto, data, ahora)) {
      removidos.push(item?.producto?.nombre || id);
      delete items[id];
    }
  });
  return removidos;
}

export function programarActivacionCatalogo(data, callback) {
  const ahora = Date.now();
  const siguiente = (data?.categorias || [])
    .map(categoria => Date.parse(categoria.activoDesde || ''))
    .filter(fecha => Number.isFinite(fecha) && fecha > ahora)
    .sort((a, b) => a - b)[0];

  if (!siguiente) return;
  const esperar = Math.min(siguiente - ahora + 1_000, MAX_TIMEOUT_MS);
  window.setTimeout(() => {
    callback?.();
    programarActivacionCatalogo(data, callback);
  }, esperar);
}