# 🏥 Farmacia 2.0 - Sistema de Kits

Sistema inteligente de gestión de insumos médicos que asocia automáticamente los descartables necesarios según el medicamento o procedimiento seleccionado.

## 🚀 Características

- **Base de datos completa** con todos los insumos del vademécum
- **Búsqueda inteligente** de medicamentos e insumos
- **Generación automática** de kits de descartables asociados
- **Lógica de análogos** para cuando no hay stock exacto
- **Historial de descargos** con registro de cada solicitud
- **Exportación a JSON** para integración con sistemas de farmacia
- **Impresión de kits** para uso en enfermería

## 📋 ¿Cómo funciona?

1. **El médico** busca el medicamento o insumo en la base de datos
2. **El sistema** identifica automáticamente qué descartables necesita
3. **Se genera un kit** con todos los insumos asociados
4. **Se puede descargar** el kit en formato JSON para farmacia
5. **Queda registrado** en el historial para trazabilidad

## 🧩 Kits disponibles

| Tipo de insumo | Descartables asociados |
|----------------|------------------------|
| **F.A./Ampolla** | Jeringa, agujas (según vía IV/IM/SC), agua destilada |
| **Sonda Vesical** | Bolsa colectora, jeringa 10ml, agua destilada, lubricante, guantes, barbijo, gasas |
| **Sonda Nasogástrica** | Jeringas de alimentación, guantes, gasas, barbijo, lubricante |
| **Catéter Central** | Guantes, barbijo, gasas, jeringas, agujas, llave de 3 vías, antiséptico, apósito |
| **Apósitos/Vendas** | Guantes, antiséptico, gasas, cinta adhesiva |

## 🛠️ Tecnologías utilizadas

- HTML5 + CSS3
- JavaScript Vanilla
- SheetJS (XLSX) para lectura de Excel
- GitHub Pages para hosting

## 📦 Instalación

```bash
git clone https://github.com/tu-usuario/farmacia-2.0.git
cd farmacia-2.0
