# 🏥 Sistema de Pedidos de Farmacia - Vademécum

Sistema web para gestión de pedidos de farmacia hospitalaria, con clasificación automática de medicamentos e insumos, control de stock y gestión de kits.

## ✨ Características

- 📋 **Vademécum completo** organizado y clasificado
- 💊 **Medicamentos** con vía de administración
- 🛠️ **Insumos** médicos y descartables
- 📦 **Kits predefinidos** para procedimientos comunes
- 🛒 **Carrito de pedidos** intuitivo
- 👨‍⚕️ **Roles diferenciados** (Médico, Enfermería, Farmacia)
- 📊 **Control de stock** en tiempo real
- 🔍 **Búsqueda avanzada** por nombre o código
- 🔄 **Análogos directos** cuando no hay stock

## 🚀 Instalación Rápida

### Requisitos
- Python 3.8+
- pip (gestor de paquetes)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/vademecum-pedidos.git
cd vademecum-pedidos

# 2. Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Colocar el archivo vademecum.xlsx en la carpeta data/
# (El sistema lo procesará automáticamente)

# 5. Ejecutar la aplicación
python app.py