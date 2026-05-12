# Casos de Uso: Credencial Digital

## CU-01 — Generar Credencial Digital

| Campo | Descripción |
|---|---|
| **Identificador** | CU-01 |
| **Nombre** | Generar Credencial Digital |
| **Actores** | Administrador del Sistema |
| **Disparador** | El Administrador del Sistema completa el registro de un nuevo usuario en la plataforma y confirma el alta con estatus activo. |
| **Descripción** | El sistema genera automáticamente un código QR único para cada usuario al momento de su registro en la plataforma, el cual servirá como credencial digital de identificación. |
| **Precondiciones** | 1. El usuario ha sido dado de alta en el sistema con sus datos personales completos.<br>2. El usuario tiene un rol asignado (alumno, profesor, administrativo, etc.).<br>3. El usuario tiene un estatus activo. |
| **Postcondiciones** | 1. Se genera un código QR único vinculado al usuario.<br>2. El código QR queda almacenado en la base de datos.<br>3. El código QR está disponible para visualización en el perfil del usuario. |
| **Frecuencia de uso** | Una vez por usuario |
| **Prioridad** | Alta |
| **Flujo Normal** | 1. El Administrador del Sistema registra a un nuevo usuario ingresando sus datos personales completos.<br>2. El Administrador asigna un rol al usuario (alumno, profesor, administrativo, etc.).<br>3. El Administrador confirma el alta del usuario con estatus activo.<br>4. El sistema valida que los datos personales estén completos, que el rol esté asignado y que el estatus sea activo.<br>5. El sistema genera un código QR único asociado al identificador del usuario.<br>6. El sistema almacena el código QR en la base de datos vinculándolo al perfil del usuario.<br>7. El sistema confirma al Administrador que la credencial digital fue generada exitosamente.<br>8. El código QR queda disponible para visualización en el perfil del usuario. |
| **Flujos Alternativos** | **El usuario ya existía pero fue reactivado:**<br>1. En el paso 3, el Administrador reactiva a un usuario previamente dado de baja cambiando su estatus a activo.<br>2. El sistema detecta que el usuario no tiene un código QR vigente.<br>3. Se retoma el flujo normal desde el paso 4 para generar una nueva credencial digital. |
| **Excepciones** | **Datos personales incompletos:** En el paso 4, si el sistema detecta que faltan datos obligatorios del usuario, se muestra un mensaje de error indicando los campos faltantes y no se genera el código QR. El Administrador debe completar los datos antes de reintentar.<br>**Rol no asignado:** En el paso 4, si el usuario no tiene un rol asignado, el sistema notifica al Administrador que debe asignar un rol antes de poder generar la credencial.<br>**Fallo en la generación del código QR:** En el paso 5, si ocurre un error técnico durante la generación del código QR, el sistema registra el error en el log, notifica al Administrador y le permite reintentar la operación.<br>**Error al almacenar en la base de datos:** En el paso 6, si el código QR no puede ser almacenado, el sistema muestra un mensaje de error y el Administrador puede reintentar. |
| **Reglas de Negocio** | 1. Cada código QR debe ser único en todo el sistema.<br>2. Solo se puede generar una credencial digital por usuario activo.<br>3. El código QR debe estar vinculado directamente al identificador único del usuario.<br>4. No se puede generar un código QR para usuarios con estatus inactivo o dado de baja.<br>5. Solo el Administrador del Sistema tiene permisos para desencadenar el proceso de alta que genera la credencial. |
| **Requerimientos Especiales** | 1. Se requiere una librería o servicio de generación de códigos QR compatible con la plataforma.<br>2. El código QR generado debe ser almacenable en formato de imagen (PNG o SVG) o como cadena codificada en Base64.<br>3. El proceso de generación debe completarse en un tiempo no mayor a 5 segundos.<br>4. El código QR debe tener resolución suficiente para ser escaneado desde la pantalla de un dispositivo móvil. |
| **Suposiciones** | 1. Se asume que el sistema ya cuenta con un módulo de registro de usuarios funcional.<br>2. Se asume que la base de datos tiene una tabla o campo destinado a almacenar el código QR de cada usuario.<br>3. Se asume que el código QR contiene información suficiente para identificar al usuario, pero no datos sensibles en texto plano.<br>4. Se asume que la generación del QR es un proceso automatizado que se ejecuta al momento de confirmar el alta. |

## CU-02 — Visualizar Credencial Digital Personal

| Campo | Descripción |
|---|---|
| **Identificador** | CU-02 |
| **Nombre** | Visualizar Credencial Digital Personal |
| **Actores** | Alumno, Profesor, Personal Administrativo, Técnico de Laboratorio, Personal Operativo, Personal de Cafetería |
| **Disparador** | El usuario inicia sesión en el sistema y selecciona la opción de visualizar su credencial digital desde su perfil. |
| **Descripción** | El usuario accede a su perfil para visualizar su credencial digital y poder presentarla en los puntos de validación del campus. |
| **Precondiciones** | 1. El usuario ha iniciado sesión en el sistema.<br>2. El usuario tiene una credencial digital generada.<br>3. El estatus del usuario es activo. |
| **Postcondiciones** | 1. El código QR se muestra en pantalla listo para ser escaneado.<br>2. Opcionalmente, el usuario puede descargar su credencial. |
| **Frecuencia de uso** | Múltiples veces al día por usuario |
| **Prioridad** | Alta |
| **Flujo Normal** | 1. El usuario inicia sesión en el sistema con sus credenciales.<br>2. El usuario navega a su perfil o selecciona la opción “Ver Credencial Digital”.<br>3. El sistema verifica que el usuario tiene estatus activo.<br>4. El sistema consulta en la base de datos el código QR vinculado al usuario.<br>5. El sistema muestra el código QR en pantalla con un tamaño adecuado para ser escaneado.<br>6. El usuario presenta el código QR en el punto de validación del campus. |
| **Flujos Alternativos** | **El usuario descarga su credencial:**<br>1. En el paso 5, después de que el código QR se muestra en pantalla, el usuario selecciona la opción “Descargar Credencial”.<br>2. El sistema genera un archivo descargable (imagen PNG o PDF) con el código QR.<br>3. El archivo se descarga en el dispositivo del usuario.<br>4. El usuario puede usar el archivo descargado para presentar su credencial sin necesidad de estar conectado al sistema. |
| **Excepciones** | **Credencial no encontrada:** En el paso 4, si el sistema no encuentra un código QR asociado al usuario, se muestra un mensaje indicando que la credencial aún no ha sido generada y se sugiere contactar al Administrador del Sistema.<br>**Estatus inactivo:** En el paso 3, si el estatus del usuario no es activo, se muestra un mensaje indicando que no puede visualizar su credencial.<br>**Error de carga del código QR:** En el paso 5, si ocurre un error técnico al renderizar el código QR, el sistema muestra un mensaje de error y ofrece la opción de reintentar. |
| **Reglas de Negocio** | 1. Solo el usuario propietario puede visualizar su propia credencial digital.<br>2. El código QR solo se muestra si el estatus del usuario es activo.<br>3. La opción de descarga es opcional y complementaria a la visualización en pantalla.<br>4. El sistema no debe mostrar datos sensibles junto al código QR. |
| **Requerimientos Especiales** | 1. El código QR debe mostrarse con resolución suficiente para ser escaneado.<br>2. La interfaz debe ser responsiva.<br>3. El tiempo de carga del código QR no debe superar los 3 segundos.<br>4. Si se ofrece descarga, el archivo debe ser liviano. |
| **Suposiciones** | 1. Se asume que el caso de uso “Generar Credencial Digital” ya se ejecutó previamente.<br>2. Se asume que el usuario tiene acceso a un dispositivo con navegador web o la aplicación del sistema.<br>3. Se asume que los puntos de validación cuentan con lectores de QR funcionales.<br>4. Se asume que la sesión del usuario permanece activa mientras presenta su credencial. |
