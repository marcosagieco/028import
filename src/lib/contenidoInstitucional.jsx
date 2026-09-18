// El texto de las páginas institucionales: quiénes somos, envíos, medios de pago,
// términos, privacidad y botón de arrepentimiento.
//
// Antes vivía dentro de HomeClient y se mostraba cambiando una variable, sin cambiar
// la dirección: no se podía compartir el enlace de "Envíos" ni Google podía indexarlo.
// Ahora está acá, aparte, y cada sección es una página de verdad que lo usa. Es sólo
// texto y etiquetas, sin nada del navegador, así que lo arma el servidor.

export const CONTENIDO_INSTITUCIONAL = {
  nosotros: {
    title: "Nuestra Esencia",
    subtitle: "Acerca de 028 IMPORT",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-xl font-medium text-[#111111] leading-snug">En 028 IMPORT no solo entregamos productos; brindamos una experiencia de exclusividad, confianza y absoluta prioridad al tiempo de nuestros clientes.</p>
        <p>Nacimos con el firme propósito de establecer un nuevo estándar en la importación y distribución de artículos premium. Entendemos que el lujo moderno no se trata únicamente de lo que adquieres, sino de cómo lo adquieres. Por ello, hemos diseñado un ecosistema de atención al cliente meticuloso, donde la amabilidad, la inmediatez y la transparencia son nuestros pilares innegociables.</p>
        <p>Nuestro catálogo es el resultado de una curaduría exhaustiva. Cada marca y cada modelo que ofrecemos ha sido seleccionado bajo los más estrictos controles de calidad e idoneidad, garantizando a nuestros usuarios el acceso a lo mejor del mercado global sin intermediarios innecesarios y con la certeza de un origen 100% legítimo.</p>
        <div className="border-l-4 border-[#fcdb00] pl-6 py-2 my-10 bg-gray-50 rounded-r-2xl">
          <p className="italic text-gray-800 text-lg font-medium">"Creemos firmemente que el tiempo de nuestro cliente es su activo más valioso. Por eso, nuestro compromiso es la excelencia y la velocidad en cada entrega."</p>
        </div>
        <p>Agradecemos tu confianza y te damos la bienvenida a la experiencia 028.</p>
      </div>
    )
  },
  terminos: {
    title: "Términos y Condiciones",
    subtitle: "Legal & Políticas Comerciales",
    body: (
      <div className="space-y-8 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>El acceso y uso de la plataforma 028 IMPORT (en adelante, "la Tienda" o "Nosotros") se rige por los presentes Términos y Condiciones. Al utilizar nuestro sitio web, usted acepta íntegramente las políticas aquí detalladas.</p>
        
        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">1. Naturaleza del Servicio</h3>
          <p>028 IMPORT opera como un catálogo virtual interactivo. Los productos añadidos a la "Bolsa de Compras" no constituyen una reserva legal de inventario ni una transacción comercial finalizada. La confirmación del pedido, fijación del precio final y reserva de stock se perfecciona de manera exclusiva a través de nuestro canal oficial de WhatsApp, mediado por un asesor de ventas.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">2. Precios y Disponibilidad</h3>
          <p>Nos esforzamos por mantener nuestro catálogo actualizado en tiempo real. No obstante, debido a fluctuaciones arancelarias y dinámicas del mercado de importación, los precios publicados tienen carácter referencial. 028 IMPORT se reserva el derecho de modificar los precios sin previo aviso antes de la confirmación formal del pago.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">3. Garantía de Originalidad</h3>
          <p>Garantizamos de manera absoluta la autenticidad y el origen legítimo de todos los artículos comercializados. Todo producto es entregado en su embalaje original y con los sellos de seguridad correspondientes emitidos por el fabricante.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">4. Política de Cambios y Garantías</h3>
          <p>Dado el carácter personal y consumible de gran parte de nuestro catálogo, no se aceptarán cambios ni devoluciones por motivos de "insatisfacción" o error en la elección del sabor/modelo una vez que el precinto de seguridad haya sido vulnerado. Solo se admitirán reclamos por defectos técnicos de fabricación, los cuales deberán ser notificados dentro de las 48 horas posteriores a la recepción, adjuntando evidencia visual.</p>
        </div>
      </div>
    )
  },
  privacidad: {
    title: "Política de Privacidad",
    subtitle: "Protección de Datos Personales",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-lg font-medium text-[#111111]">En 028 IMPORT, la salvaguarda y confidencialidad de su información personal es una absoluta prioridad.</p>
        <p>La presente Política de Privacidad describe cómo recopilamos, utilizamos y protegemos los datos que usted nos proporciona, en estricto cumplimiento con la Ley de Protección de los Datos Personales (Nº 25.326) de la República Argentina.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Recopilación de Información</h3>
        <p>A través de nuestra plataforma, podemos solicitar datos básicos como su nombre y datos de domicilio/ubicación (para envíos). No procesamos ni almacenamos datos financieros, bancarios ni tarjetas de crédito en nuestros servidores.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Uso Exclusivo de los Datos</h3>
        <p>La información recolectada se utiliza con los siguientes fines exclusivos:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Gestión logística y coordinación efectiva de las entregas.</li>
          <li>Comunicación directa vía WhatsApp para confirmación de pedidos.</li>
        </ul>

        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">No Divulgación a Terceros</h3>
        <p>028 IMPORT garantiza que bajo ninguna circunstancia comercializará, alquilará ni compartirá su base de datos de clientes con entidades externas, agencias de publicidad o terceros no involucrados en la cadena logística de su pedido.</p>
      </div>
    )
  },
  envios: {
    title: "Envíos y Entregas",
    subtitle: "Logística Premium",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-lg font-medium text-[#111111]">Sabemos que la inmediatez es fundamental. Por ello, hemos diseñado un esquema logístico ágil, seguro y adaptado a sus necesidades.</p>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#fcdb00] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-bolt"></i> Envío Flash</h3>
          <p className="text-sm">Para zonas seleccionadas, ofrecemos un servicio de entrega en menos de 30 minutos abonando mediante transferencia bancaria. Ideal para quienes necesitan sus productos de forma inmediata.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-motorcycle"></i> Motomensajería Programada</h3>
          <p className="text-sm">Contamos con un servicio propio de motomensajería con salidas organizadas en tres turnos fijos (13:00hs - 16:00hs - 20:00hs). Esto nos permite garantizar un tiempo de entrega predecible y seguro. Aboná con efectivo o transferencia.</p>
        </div>
      </div>
    )
  },
  pagos: {
    title: "Medios de Pago",
    subtitle: "Transacciones Seguras",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>Con el objetivo de garantizar su seguridad y ofrecerle flexibilidad, en 028 IMPORT procesamos los pagos por fuera de la plataforma web, evitando que usted deba ingresar datos sensibles en línea.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-4">Alternativas Disponibles:</h3>
        
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[#111111]"><i className="fas fa-university text-[#fcdb00]"></i></div>
            <div>
              <p className="font-bold text-[#111111]">Transferencia Bancaria (ARS)</p>
              <p className="text-sm mt-1">Acreditación rápida mediante CBU/CVU o Alias. La app le mostrará nuestro Alias oficial durante el proceso de compra (Titular: Lucio Bunge).</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[#111111]"><i className="fas fa-money-bill-wave text-[#fcdb00]"></i></div>
            <div>
              <p className="font-bold text-[#111111]">Efectivo</p>
              <p className="text-sm mt-1">Disponible para envíos mediante nuestra Motomensajería (Pago contra entrega).</p>
            </div>
          </li>
        </ul>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-xs uppercase tracking-widest font-black text-gray-400 mb-2">Aviso de Seguridad</p>
          <p className="text-sm">Bajo ninguna circunstancia el personal de 028 IMPORT le solicitará los dígitos de su tarjeta de crédito, claves de seguridad o contraseñas bancarias a través de esta plataforma ni por canales no oficiales.</p>
        </div>
      </div>
    )
  },
  arrepentimiento: {
    title: "Botón de Arrepentimiento",
    subtitle: "Marco Legal y Devoluciones",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>En cumplimiento con las disposiciones de la Dirección Nacional de Defensa del Consumidor, 028 IMPORT pone a su disposición las directrices para la revocación de compra.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Plazo Legal</h3>
        <p>Usted tiene el derecho irrevocable de cancelar su compra dentro de un plazo máximo de <strong>10 (diez) días corridos</strong> contados desde la fecha de recepción del producto en su domicilio.</p>

        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Condiciones Innegociables para Aceptación</h3>
        <p>Dada la naturaleza de los productos comercializados en nuestro catálogo (artículos de consumo personal e higiene), la devolución será aceptada pura y exclusivamente si se cumplen los siguientes requisitos de manera estricta:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>El producto debe encontrarse en <strong>estado impecable, inmaculado y totalmente sin uso</strong>.</li>
          <li>Los sellos térmicos, precintos de fábrica y plásticos protectores deben estar <strong>intactos y sin alteraciones</strong>.</li>
          <li>El packaging o cajas no deben presentar roturas, marcas ni abolladuras.</li>
        </ul>

        <div className="bg-red-50 text-red-800 p-4 rounded-xl mt-6 border border-red-100 text-sm">
          <strong>IMPORTANTE:</strong> Por normativas sanitarias, si un dispositivo electrónico de consumo o esencia ha sido abierto, encendido o sus sellos han sido rotos, se perderá automáticamente el derecho a devolución por arrepentimiento.
        </div>

        <p className="mt-8">Para iniciar el trámite, le solicitamos contactarse inmediatamente a nuestra línea de WhatsApp informando su número de pedido y adjuntando fotografías del estado del producto.</p>
      </div>
    )
  }
};
