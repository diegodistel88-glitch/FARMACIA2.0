// ======================================================================
// 1. VARIABLES GLOBALES
// ======================================================================

let vademecum = [];
let historialDescargos = [];
let insumoSeleccionado = null;

// ======================================================================
// 2. CARGAR DATOS DESDE EL EXCEL
// ======================================================================

async function cargarDatos() {
    try {
        const response = await fetch('data/vademecum.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el JSON');
        }
        vademecum = await response.json();
        document.getElementById('dbStatus').textContent = `✅ ${vademecum.length} registros cargados`;
        mostrarToast(`Base de datos cargada: ${vademecum.length} registros`, 'success');
        return;
    } catch (e) {
        console.log('Intentando cargar Excel directamente...');
        // Si no hay JSON, intentar cargar el Excel
        cargarExcelDirecto();
    }
}

function cargarExcelDirecto() {
    // Crear un input de archivo oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            try {
                const data = new Uint8Array(loadEvent.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                vademecum = jsonData.map(row => ({
                    codigo: row.Codigo || row.codigo || '',
                    nombre: row.Nombre_Base || row.nombre || row.Descripcion_Limpia || '',
                    formato: row.Tipo_Estandarizado || row.formato || '',
                    categoria: row.Categoria || row.categoria || '',
                    concentracion: row.Concentracion_Valor || row.concentracion || '',
                    unidad: row.Concentracion_Unidad || row.unidad || '',
                    via: row.Via_Administracion || row.via || '',
                    descripcion: row.Descripcion_Limpia || row.descripcion || ''
                }));
                document.getElementById('dbStatus').textContent = `✅ ${vademecum.length} registros cargados (Excel)`;
                mostrarToast(`Excel cargado: ${vademecum.length} registros`, 'success');
            } catch (err) {
                document.getElementById('dbStatus').textContent = '❌ Error al leer el Excel';
                mostrarToast('Error al leer el archivo Excel', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

// ======================================================================
// 3. BUSCAR INSUMOS
// ======================================================================

function buscarInsumos() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('resultados');
    
    if (!query) {
        container.innerHTML = `<p class="hint">Escribe para buscar...</p>`;
        return;
    }
    
    const resultados = vademecum.filter(item => {
        const texto = `${item.nombre} ${item.descripcion} ${item.codigo} ${item.formato}`.toLowerCase();
        return texto.includes(query);
    });
    
    if (resultados.length === 0) {
        container.innerHTML = `<p class="hint">No se encontraron resultados para "${query}"</p>`;
        return;
    }
    
    container.innerHTML = resultados.slice(0, 30).map(item => `
        <div class="resultado-item" onclick="seleccionarInsumo(${item.codigo})">
            <div>
                <div class="nombre">${item.nombre}</div>
                <div class="detalle">${item.formato} | ${item.concentracion || 'N/E'}</div>
            </div>
            <span class="codigo">#${item.codigo}</span>
        </div>
    `).join('');
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('resultados').innerHTML = `<p class="hint">Escribe para buscar...</p>`;
    document.getElementById('detailPanel').style.display = 'none';
}

// ======================================================================
// 4. SELECCIONAR INSUMO Y MOSTRAR KIT
// ======================================================================

function seleccionarInsumo(codigo) {
    const item = vademecum.find(i => i.codigo == codigo);
    if (!item) return;
    
    insumoSeleccionado = item;
    
    // Mostrar panel de detalle
    const panel = document.getElementById('detailPanel');
    panel.style.display = 'block';
    
    // Llenar datos del insumo
    document.getElementById('detailNombre').textContent = item.nombre;
    document.getElementById('detailCodigo').textContent = `Código: ${item.codigo}`;
    document.getElementById('detailFormato').textContent = item.formato || 'N/E';
    document.getElementById('detailCategoria').textContent = item.categoria || 'N/E';
    document.getElementById('detailConcentracion').textContent = item.concentracion ? `${item.concentracion} ${item.unidad || ''}` : 'N/E';
    document.getElementById('detailVia').textContent = item.via || 'No especificada';
    
    // Generar kit asociado
    generarKit(item);
    
    // Scroll al detalle
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ======================================================================
// 5. GENERAR KIT DE DESCARTABLES ASOCIADOS
// ======================================================================

function generarKit(item) {
    const container = document.getElementById('kitContainer');
    const kit = obtenerKitAsociado(item);
    
    if (!kit || kit.length === 0) {
        container.innerHTML = `<p class="hint">Este insumo no requiere descartables asociados</p>`;
        return;
    }
    
    container.innerHTML = kit.map(k => `
        <div class="kit-item">
            <span>${k.nombre}</span>
            <span>
                <span class="kit-cantidad">x${k.cantidad}</span>
                <span class="kit-stock ${k.stock > 0 ? 'stock-disponible' : 'stock-agotado'}">
                    ${k.stock > 0 ? `✅ ${k.stock} uds` : '❌ Sin stock'}
                </span>
            </span>
        </div>
    `).join('');
}

// ======================================================================
// 6. LÓGICA DE ASOCIACIÓN DE KITS
// ======================================================================

function obtenerKitAsociado(item) {
    const kit = [];
    const nombre = item.nombre.toUpperCase();
    const formato = item.formato || '';
    const via = item.via || '';
    
    // ===== 1. MEDICAMENTOS INYECTABLES =====
    if (formato.includes('INYECTABLE') || formato.includes('AMPOLLA') || formato.includes('F.A.')) {
        // Jeringa
        kit.push(buscarInsumoPorTipo('JERINGA', '10 ML', ['10 ML', '5 ML', '20 ML']));
        
        // Agujas (según vía)
        if (via.includes('INTRAVENOSO') || via.includes('IV')) {
            kit.push(buscarInsumoPorTipo('AGUJA', '25/8', ['25/8', '25/7', '40/8']));
            kit.push(buscarInsumoPorTipo('AGUJA', '25/8', ['25/8', '25/7', '40/8']));
        } else if (via.includes('INTRAMUSCULAR') || via.includes('IM')) {
            kit.push(buscarInsumoPorTipo('AGUJA', '40/8', ['40/8', '50/8', '25/7']));
        } else if (via.includes('SUBCUTANEO') || via.includes('SC')) {
            kit.push(buscarInsumoPorTipo('AGUJA', '16/5', ['16/5', '25/8', '25/7']));
        }
        
        // Agua destilada (si no es agua)
        if (!nombre.includes('AGUA DESTILADA')) {
            kit.push(buscarInsumoPorTipo('AGUA', '10 ML', ['10 ML', '5 ML']));
        }
        
        // Diluyente (si es IV)
        if (via.includes('INTRAVENOSO') || via.includes('IV')) {
            kit.push(buscarInsumoPorTipo('DILUYENTE', 'SF', ['SF', 'DEXTROSA']));
        }
    }
    
    // ===== 2. SONDAS VESICALES =====
    if (nombre.includes('SONDA FOLLEY') || nombre.includes('SONDA FOLEY')) {
        kit.push(buscarInsumoPorTipo('BOLSA', '', []));
        kit.push(buscarInsumoPorTipo('JERINGA', '10 ML', ['10 ML', '5 ML']));
        kit.push(buscarInsumoPorTipo('AGUA', '10 ML', ['10 ML', '5 ML']));
        kit.push(buscarInsumoPorTipo('LUBRICANTE', '', []));
        kit.push(buscarInsumoPorTipo('GUANTE', '', []));
        kit.push(buscarInsumoPorTipo('GASA', '', []));
        kit.push(buscarInsumoPorTipo('BARBIJO', '', []));
    }
    
    // ===== 3. SONDAS NASOGÁSTRICAS =====
    if (nombre.includes('SONDA TIPO K') || nombre.includes('NASOGASTRICA')) {
        kit.push(buscarInsumoPorTipo('JERINGA', '60 ML', ['60 ML', '50 ML']));
        kit.push(buscarInsumoPorTipo('JERINGA', '20 ML', ['20 ML', '10 ML']));
        kit.push(buscarInsumoPorTipo('GUANTE', '', []));
        kit.push(buscarInsumoPorTipo('GASA', '', []));
        kit.push(buscarInsumoPorTipo('BARBIJO', '', []));
        kit.push(buscarInsumoPorTipo('LUBRICANTE', '', []));
    }
    
    // ===== 4. CATÉTERES VENOSOS CENTRALES =====
    if (nombre.includes('CATETER VENOSO CENTRAL') || nombre.includes('SET P/CATETERISMO VENA CAVA')) {
        kit.push(buscarInsumoPorTipo('GUANTE', '', [], 4));
        kit.push(buscarInsumoPorTipo('BARBIJO', '', [], 2));
        kit.push(buscarInsumoPorTipo('GASA', '', [], 10));
        kit.push(buscarInsumoPorTipo('JERINGA', '10 ML', ['10 ML', '5 ML'], 3));
        kit.push(buscarInsumoPorTipo('AGUJA', '25/8', ['25/8', '25/7'], 2));
        kit.push(buscarInsumoPorTipo('LLAVE', '', [], 2));
        kit.push(buscarInsumoPorTipo('ANTISEPTICO', '', []));
        kit.push(buscarInsumoPorTipo('APOSITO', '', []));
    }
    
    // ===== 5. APÓSITOS Y CURACIONES =====
    if (nombre.includes('APOSITO') || nombre.includes('VENDA') || nombre.includes('GASA')) {
        kit.push(buscarInsumoPorTipo('GUANTE', '', []));
        kit.push(buscarInsumoPorTipo('ANTISEPTICO', '', []));
        kit.push(buscarInsumoPorTipo('GASA', '', [], 3));
        kit.push(buscarInsumoPorTipo('CINTA', '', []));
    }
    
    // Filtrar items nulos y duplicados
    return kit.filter(k => k !== null && k.nombre !== null && !kit.some(existente => existente.nombre === k.nombre && existente.cantidad === k.cantidad));
}

// ======================================================================
// 7. BUSCAR INSUMOS POR TIPO (con análogos)
// ======================================================================

function buscarInsumoPorTipo(tipo, medida, alternativas, cantidad = 1) {
    // Buscar en el vademécum
    let candidates = vademecum.filter(item => {
        const itemStr = `${item.nombre} ${item.formato}`.toUpperCase();
        return itemStr.includes(tipo.toUpperCase());
    });
    
    // Si hay medida, buscar exacto
    if (medida) {
        let exactos = candidates.filter(item => 
            item.concentracion && item.concentracion.includes(medida)
        );
        if (exactos.length > 0) {
            return { ...exactos[0], cantidad };
        }
    }
    
    // Buscar análogos por alternativas
    for (let alt of alternativas) {
        if (!alt) continue;
        let analogos = candidates.filter(item => 
            item.concentracion && item.concentracion.includes(alt)
        );
        if (analogos.length > 0) {
            return { ...analogos[0], cantidad };
        }
    }
    
    // Si no hay, tomar el primero disponible del tipo
    if (candidates.length > 0) {
        return { ...candidates[0], cantidad };
    }
    
    // Crear un item genérico si no se encuentra
    return {
        codigo: '---',
        nombre: `${tipo} (No encontrado)`,
        formato: 'N/A',
        cantidad: cantidad,
        stock: 0
    };
}

// ======================================================================
// 8. DESCARGAR KIT Y REGISTRAR
// ======================================================================

function descargarKit() {
    if (!insumoSeleccionado) {
        mostrarToast('Selecciona un insumo primero', 'error');
        return;
    }
    
    const kit = obtenerKitAsociado(insumoSeleccionado);
    if (!kit || kit.length === 0) {
        mostrarToast('Este insumo no requiere descartables', 'info');
        return;
    }
    
    // Registrar descargo
    const descargo = {
        fecha: new Date().toLocaleString(),
        insumo: insumoSeleccionado.nombre,
        codigo: insumoSeleccionado.codigo,
        kit: kit.map(k => ({ nombre: k.nombre, cantidad: k.cantidad })),
        totalItems: kit.reduce((sum, k) => sum + k.cantidad, 0)
    };
    
    historialDescargos.push(descargo);
    actualizarHistorial();
    
    // Mostrar mensaje
    mostrarToast(`✅ Kit descargado: ${descargo.totalItems} insumos`, 'success');
    
    // Descargar como JSON
    descargarJSON(descargo);
}

function descargarJSON(descargo) {
    const dataStr = JSON.stringify(descargo, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `descargo_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function imprimirKit() {
    window.print();
}

// ======================================================================
// 9. ACTUALIZAR HISTORIAL
// ======================================================================

function actualizarHistorial() {
    const container = document.getElementById('historialContainer');
    if (historialDescargos.length === 0) {
        container.innerHTML = `<p class="hint">No hay descargos registrados</p>`;
        return;
    }
    
    container.innerHTML = historialDescargos.slice().reverse().map(h => `
        <div class="historial-item">
            <span><strong>${h.insumo}</strong> (${h.totalItems} insumos)</span>
            <span class="fecha">${h.fecha}</span>
        </div>
    `).join('');
}

// ======================================================================
// 10. TOAST Y UTILIDADES
// ======================================================================

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ======================================================================
// 11. INICIALIZACIÓN
// ======================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Fecha actual
    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Cargar datos
    cargarDatos();
    
    // Tecla Enter para buscar
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') buscarInsumos();
    });
});

console.log('🏥 Sistema de Kits Médicos cargado');
