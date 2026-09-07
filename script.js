// ======================================================================
// FARMACIA 2.0 - Sistema de Kits Médicos
// ======================================================================

// ======================================================================
// 1. VARIABLES GLOBALES
// ======================================================================

let vademecum = [];
let historialDescargos = [];
let insumoSeleccionado = null;
let ultimoDescargo = null;

// ======================================================================
// 2. CARGAR DATOS DESDE EL EXCEL
// ======================================================================

async function cargarDatos() {
    try {
        // Intentar cargar desde JSON primero
        const response = await fetch('data/vademecum.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON');
        vademecum = await response.json();
        document.getElementById('dbStatus').textContent = `✅ ${vademecum.length} registros`;
        actualizarResultados();
        mostrarToast(`Base de datos cargada: ${vademecum.length} registros`, 'success');
        return;
    } catch (e) {
        console.log('Intentando cargar Excel directamente...');
        // Si no hay JSON, cargar el Excel
        cargarExcelDirecto();
    }
}

function cargarExcelDirecto() {
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
                document.getElementById('dbStatus').textContent = `✅ ${vademecum.length} registros (Excel)`;
                actualizarResultados();
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
    const countEl = document.getElementById('resultCount');
    
    if (!query) {
        container.innerHTML = `<p class="hint">🔎 Escribe para buscar en el vademécum...</p>`;
        countEl.textContent = '';
        return;
    }
    
    const resultados = vademecum.filter(item => {
        const texto = `${item.nombre} ${item.descripcion} ${item.codigo} ${item.formato} ${item.categoria}`.toLowerCase();
        return texto.includes(query);
    });
    
    countEl.textContent = `${resultados.length} resultados`;
    
    if (resultados.length === 0) {
        container.innerHTML = `<p class="hint">❌ No se encontraron resultados para "${query}"</p>`;
        return;
    }
    
    container.innerHTML = resultados.slice(0, 50).map(item => `
        <div class="resultado-item" onclick="seleccionarInsumo(${item.codigo})">
            <div>
                <div class="nombre">${item.nombre}</div>
                <div class="detalle">${item.formato || 'N/E'} | ${item.concentracion ? item.concentracion + ' ' + (item.unidad || '') : 'N/E'}</div>
            </div>
            <span class="codigo">#${item.codigo}</span>
        </div>
    `).join('');
}

function actualizarResultados() {
    const query = document.getElementById('searchInput').value;
    if (query) buscarInsumos();
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('resultados').innerHTML = `<p class="hint">🔎 Escribe para buscar en el vademécum...</p>`;
    document.getElementById('resultCount').textContent = '';
    document.getElementById('detailPanel').style.display = 'none';
    insumoSeleccionado = null;
}

// ======================================================================
// 4. SELECCIONAR INSUMO Y MOSTRAR KIT
// ======================================================================

function seleccionarInsumo(codigo) {
    const item = vademecum.find(i => i.codigo == codigo);
    if (!item) {
        mostrarToast('Insumo no encontrado', 'error');
        return;
    }
    
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
    document.getElementById('detailFormatoBadge').textContent = item.formato || 'N/E';
    
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
        container.innerHTML = `<p class="hint">✅ Este insumo no requiere descartables asociados</p>`;
        return;
    }
    
    // Calcular total de items
    const totalItems = kit.reduce((sum, k) => sum + (k.cantidad || 1), 0);
    
    let html = `<div style="margin-bottom:8px; font-size:0.85em; color:#4a5568;">Total de insumos: <strong>${totalItems}</strong></div>`;
    
    html += kit.map(k => `
        <div class="kit-item">
            <div class="kit-nombre">
                <span>${k.nombre}</span>
                <span class="kit-cantidad">x${k.cantidad || 1}</span>
            </div>
            <span class="kit-stock ${k.stock > 0 ? 'stock-disponible' : 'stock-agotado'}">
                ${k.stock > 0 ? `✅ ${k.stock} uds` : '❌ Sin stock'}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = html;
    window.kitActual = kit;
}

// ======================================================================
// 6. LÓGICA DE ASOCIACIÓN DE KITS
// ======================================================================

function obtenerKitAsociado(item) {
    const kit = [];
    const nombre = (item.nombre || '').toUpperCase();
    const formato = item.formato || '';
    const via = item.via || '';
    
    // ===== 1. MEDICAMENTOS INYECTABLES =====
    if (formato.includes('INYECTABLE') || formato.includes('AMPOLLA') || formato.includes('F.A.') || 
        formato.includes('INYECTABLE_FA') || formato.includes('AMP/F.A.')) {
        
        // Jeringa
        const jeringa = buscarInsumoPorTipo('JERINGA', '10 ML', ['10 ML', '5 ML', '20 ML', '3 ML']);
        if (jeringa) kit.push(jeringa);
        
        // Agujas (según vía)
        if (via.includes('INTRAVENOSO') || via.includes('IV') || via.includes('INTRAVENOSA')) {
            const aguja1 = buscarInsumoPorTipo('AGUJA', '25/8', ['25/8', '25/7', '40/8', '50/8']);
            if (aguja1) kit.push({ ...aguja1, cantidad: 2 });
        } else if (via.includes('INTRAMUSCULAR') || via.includes('IM')) {
            const aguja = buscarInsumoPorTipo('AGUJA', '40/8', ['40/8', '50/8', '25/7']);
            if (aguja) kit.push(aguja);
        } else if (via.includes('SUBCUTANEO') || via.includes('SC')) {
            const aguja = buscarInsumoPorTipo('AGUJA', '16/5', ['16/5', '25/8', '25/7']);
            if (aguja) kit.push(aguja);
        }
        
        // Agua destilada (si no es agua)
        if (!nombre.includes('AGUA DESTILADA')) {
            const agua = buscarInsumoPorTipo('AGUA', '10 ML', ['10 ML', '5 ML']);
            if (agua) kit.push(agua);
        }
    }
    
    // ===== 2. SONDAS VESICALES =====
    if (nombre.includes('SONDA FOLLEY') || nombre.includes('SONDA FOLEY') || 
        (nombre.includes('SONDA') && via.includes('URINARIO'))) {
        
        const items = [
            { tipo: 'BOLSA', medida: '', altern
