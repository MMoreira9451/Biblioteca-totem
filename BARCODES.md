# Códigos de Barras para Pruebas - Sistema Biblioteca Totem

Este documento contiene todos los códigos de barras de los libros de prueba en la base de datos. Use estos códigos para generar etiquetas imprimibles que pueda escanear con su pistola lectora USB.

## Cómo Generar Códigos de Barras Imprimibles

Puede usar cualquiera de estos generadores online gratuitos:

1. **Barcode Generator** (recomendado): https://barcode.tec-it.com/es
   - Seleccione formato: EAN-13
   - Ingrese el código de 13 dígitos
   - Descargue como imagen o PDF

2. **Free Online Barcode Generator**: https://www.barcodesinc.com/generator/
   - Elija tipo: EAN-13
   - Pegue el código
   - Genere y descargue

3. **Barcode-Generator.org**: https://www.barcode-generator.org/
   - Formato: EAN-13
   - Ingrese código y descargue

## Códigos de Barras Originales (Numéricos Simples)

Estos códigos fueron creados en la versión inicial:

| Código | Título | Autor |
|--------|--------|-------|
| `001001001` | Cien años de soledad | Gabriel García Márquez |
| `001001002` | El túnel | Ernesto Sabato |
| `001001003` | Rayuela | Julio Cortázar |
| `001001004` | La casa de los espíritus | Isabel Allende |
| `001001005` | Ficciones | Jorge Luis Borges |
| `002001001` | Clean Code | Robert C. Martin |
| `002001002` | Design Patterns | Gang of Four |
| `002001003` | Introduction to Algorithms | Thomas H. Cormen |

## Códigos de Barras EAN-13 (Nuevos - Pistola USB)

Estos códigos están en formato EAN-13 estándar de 13 dígitos:

### Literatura en Español

| Código EAN-13 | Título | Autor | Categoría |
|---------------|--------|-------|-----------|
| `1234567890128` | El principito | Antoine de Saint-Exupéry | Literatura Francesa |
| `1234567890135` | Don Quijote de la Mancha | Miguel de Cervantes | Literatura Española |
| `1234567890142` | La Odisea | Homero | Literatura Clásica |
| `2234567890130` | El amor en los tiempos del cólera | Gabriel García Márquez | Literatura Latinoamericana |
| `2234567890147` | Crimen y Castigo | Fiódor Dostoyevski | Literatura Rusa |

### Ficción y Entretenimiento

| Código EAN-13 | Título | Autor | Categoría |
|---------------|--------|-------|-----------|
| `2234567890123` | 1984 | George Orwell | Ciencia Ficción |
| `4234567890145` | El código Da Vinci | Dan Brown | Thriller |
| `5234567890120` | Harry Potter y la piedra filosofal | J.K. Rowling | Fantasía |
| `5234567890137` | El señor de los anillos: La comunidad del anillo | J.R.R. Tolkien | Fantasía |

### Computación y Tecnología

| Código EAN-13 | Título | Autor | Categoría |
|---------------|--------|-------|-----------|
| `3234567890122` | Python Crash Course | Eric Matthes | Computer Science |
| `3234567890139` | The Pragmatic Programmer | Andrew Hunt & David Thomas | Computer Science |
| `3234567890146` | JavaScript: The Good Parts | Douglas Crockford | Computer Science |

### No Ficción

| Código EAN-13 | Título | Autor | Categoría |
|---------------|--------|-------|-----------|
| `4234567890121` | Sapiens: De animales a dioses | Yuval Noah Harari | Historia |
| `4234567890138` | Cómo ganar amigos e influir sobre las personas | Dale Carnegie | Autoayuda |
| `5234567890144` | El arte de la guerra | Sun Tzu | Estrategia |

## Instrucciones de Uso

### 1. Generar Etiquetas

1. Visite uno de los generadores mencionados arriba
2. Seleccione formato **EAN-13**
3. Copie y pegue el código de 13 dígitos
4. Ajuste el tamaño (recomendado: 50-60mm de ancho)
5. Descargue como PDF o imagen
6. Imprima en papel adhesivo o papel normal

### 2. Preparar las Etiquetas

- Imprima todas las etiquetas que necesite
- Recorte cada etiqueta con su código
- Si usa papel normal, puede plastificar las etiquetas
- Agregue el título del libro debajo del código (opcional)

### 3. Probar el Sistema

1. Inicie sesión en el sistema con una cuenta de estudiante:
   - Email: `juan.perez@uai.edu`
   - Contraseña: `student123`

2. Seleccione la opción **"Rentar Libro"**

3. Cuando aparezca el diálogo de escaneo:
   - Apunte la pistola hacia el código de barras
   - Presione el gatillo
   - El código se ingresará automáticamente

4. Confirme el préstamo

5. Pruebe también:
   - **Devolver Libro**: Escanee un libro prestado
   - **Extender Préstamo**: Escanee un libro con préstamo activo
   - **Ver Información**: Consulte los detalles de cualquier libro

## Consejos para Mejores Resultados

### Calidad de Impresión
- Use impresora láser o de inyección de tinta de buena calidad
- Resolución mínima: 300 DPI
- Papel blanco mate (evite papel brillante que cause reflejos)

### Condiciones de Escaneo
- Ilumine bien el código de barras
- Mantenga la pistola a 5-15cm del código
- Escanee en ángulo recto (no inclinado)
- Asegúrese de que el código esté limpio y sin arrugas

### Tamaños Recomendados
- Ancho del código: 50-60mm
- Alto del código: 25-35mm
- Incluya números debajo del código (legibles por humanos)

## Creación Masiva de Etiquetas

Si necesita imprimir muchas etiquetas:

1. **Microsoft Word**:
   - Use combinación de correspondencia
   - Configure etiquetas Avery 5160 o similar
   - Inserte códigos de barras usando fuente "Libre Barcode 39"

2. **Google Sheets + Plugin**:
   - Use el plugin "Barcode Generator"
   - Importe la lista de códigos
   - Genere todos los códigos a la vez

3. **Software Especializado**:
   - **BarTender** (Windows)
   - **Labeljoy** (multiplataforma)
   - **ZebraDesigner** (gratuito para etiquetas básicas)

## Verificación de Códigos

Antes de usar las etiquetas en producción:

1. Pruebe cada código escaneándolo manualmente
2. Verifique que la pistola lee el código correctamente
3. Confirme que el sistema encuentra el libro en la base de datos
4. Repita el proceso hasta que funcione consistentemente

## Solución de Problemas

### La pistola no lee el código
- Aumente el contraste de impresión
- Verifique que el formato sea EAN-13
- Asegúrese de que el código tenga las barras de inicio y fin
- Limpie el lente de la pistola lectora

### El sistema no encuentra el libro
- Verifique que ingresó el código correctamente en init_db.py
- Confirme que la base de datos fue inicializada
- Revise que el código en la etiqueta coincide con la base de datos

### El escaneo ingresa caracteres extraños
- Configure la pistola en modo "USB Keyboard"
- Verifique la configuración de idioma del teclado (US/Latin)
- Consulte el manual de su pistola para ajustar el sufijo (debe ser Enter)

## Reiniciar la Base de Datos

Si necesita recargar los libros con los nuevos códigos:

```bash
# Desde el directorio backend
cd backend

# Ejecutar script de inicialización
python -m app.db.init_db
```

O usando Docker:

```bash
# Reiniciar el contenedor backend
docker-compose restart backend

# Ejecutar init_db dentro del contenedor
docker-compose exec backend python -m app.db.init_db
```

## Resumen de Códigos por Categoría

- **Literatura Latinoamericana**: 001001001, 001001002, 001001003, 001001004, 001001005, 2234567890130
- **Literatura Española**: 1234567890135
- **Literatura Clásica**: 1234567890142
- **Literatura Francesa**: 1234567890128
- **Literatura Rusa**: 2234567890147
- **Ciencia Ficción**: 2234567890123
- **Thriller**: 4234567890145
- **Fantasía**: 5234567890120, 5234567890137
- **Computer Science**: 002001001, 002001002, 002001003, 3234567890122, 3234567890139, 3234567890146
- **Historia**: 4234567890121
- **Autoayuda**: 4234567890138
- **Estrategia**: 5234567890144

---

**Total de libros en la base de datos**: 23 libros
**Códigos EAN-13 estándar**: 15 códigos
**Códigos numéricos simples**: 8 códigos

Para más información sobre el proyecto, consulte el [README.md](./README.md)
