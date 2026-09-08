/**
 * Archivo: pages/legal/TermsPage.tsx
 * Descripción: Términos y Condiciones de uso de la plataforma (ruta /terminos).
 * ¿Para qué? Dejar por escrito las reglas de uso del sitio y de la contratación de
 *   servicios de grooming y compra de productos, conforme a la ley colombiana.
 * ¿Impacto? Es solo contenido de frontend. Marco legal de referencia: Ley 1480 de 2011
 *   (Estatuto del Consumidor), Ley 527 de 1999 (comercio electrónico), Ley 1581 de 2012
 *   y Decreto 1377 de 2013 (protección de datos personales).
 */

import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection } from './LegalLayout';
import { BUSINESS } from '@/config/legal';

export function TermsPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      intro={
        <>
          Estos Términos y Condiciones regulan el acceso y uso de la plataforma web de{' '}
          <strong>{BUSINESS.nombreComercial}</strong> ({BUSINESS.razonSocial}, {BUSINESS.nit}),
          con domicilio en {BUSINESS.direccion}. Al crear una cuenta, iniciar sesión o usar
          cualquier función del sitio, el usuario declara que leyó, entendió y acepta estos
          términos y la{' '}
          <Link to="/privacidad" className="text-[color:var(--color-primary)] hover:underline">
            Política de Privacidad y Tratamiento de Datos Personales
          </Link>
          .
        </>
      }
    >
      <LegalSection heading="1. Objeto">
        <p>
          La plataforma permite a los clientes agendar citas de peluquería y spa para mascotas
          (grooming), reportar síntomas leves para orientación, consultar información de
          emergencia y armar pedidos de productos para recogerlos y pagarlos en el local.
        </p>
        <p>
          <strong>{BUSINESS.nombreComercial} no es una clínica ni un centro veterinario.</strong>{' '}
          No presta servicios de diagnóstico, tratamiento médico ni atención de urgencias. La
          orientación sobre síntomas leves la realiza personal auxiliar y no reemplaza la
          consulta con un médico veterinario.
        </p>
      </LegalSection>

      <LegalSection heading="2. Registro y cuenta del usuario">
        <p>
          Para usar las funciones que requieren identificación, el usuario debe registrarse
          entregando datos veraces, completos y actualizados (documento, nombre, teléfono y
          correo). El usuario es responsable de la custodia de su contraseña y de toda
          actividad realizada desde su cuenta.
        </p>
        <p>
          El registro está dirigido a personas mayores de edad. Si se registran datos de un
          menor, se entiende que lo hace su representante legal.
        </p>
      </LegalSection>

      <LegalSection heading="3. Agendamiento de citas">
        <p>
          Las citas se solicitan a través de la plataforma y quedan sujetas a confirmación por
          parte del personal según disponibilidad de agenda y horario de atención (
          {BUSINESS.horario}). Una cita solicitada no implica reserva confirmada hasta que{' '}
          {BUSINESS.nombreComercial} la confirme por el canal de contacto registrado.
        </p>
        <p>
          Por razones de bienestar animal, algunos servicios pueden no realizarse si al momento
          de la atención se identifica una condición de piel, salud o comportamiento que lo
          desaconseje. En ese caso se informará al cliente y se le orientará sobre los pasos a
          seguir.
        </p>
        <p>
          El cliente debe informar con la mayor antelación posible si no podrá asistir. La
          inasistencia reiterada sin aviso puede llevar a exigir confirmación previa para
          futuras citas.
        </p>
      </LegalSection>

      <LegalSection heading="4. Precios y pagos">
        <p>
          Los precios de los servicios de grooming se calculan a partir de un precio base más
          recargos por tamaño, tipo de pelo, condiciones de piel y comportamiento de la
          mascota, según se explica en la sección{' '}
          <Link to="/precios" className="text-[color:var(--color-primary)] hover:underline">
            «Cómo calculamos el precio»
          </Link>
          . El valor mostrado en la plataforma antes de la cita es un{' '}
          <strong>estimado</strong>; el valor final lo confirma el personal al momento de
          prestar el servicio.
        </p>
        <p>
          Los pedidos de productos se pagan de forma presencial al recogerlos en el local. La
          plataforma no procesa pagos en línea ni almacena datos de tarjetas.
        </p>
        <p>
          Todos los precios se expresan en pesos colombianos (COP) e incluyen los impuestos
          aplicables cuando corresponda.
        </p>
      </LegalSection>

      <LegalSection heading="5. Derechos del consumidor">
        <p>
          Al usuario le asisten todos los derechos reconocidos por la Ley 1480 de 2011
          (Estatuto del Consumidor) y sus normas reglamentarias, entre ellos el derecho a
          recibir información veraz, a la calidad de los bienes y servicios, a la garantía
          legal y a presentar reclamos.
        </p>
        <p>
          <strong>Derecho de retracto:</strong> en las ventas de productos realizadas a
          distancia, el consumidor podrá retractarse dentro de los cinco (5) días hábiles
          siguientes a la entrega del bien, siempre que el producto lo permita por su
          naturaleza, devolviéndolo en las mismas condiciones. Este derecho no aplica a
          servicios de grooming que ya hayan comenzado a prestarse con acuerdo del consumidor.
        </p>
        <p>
          <strong>Garantía:</strong> los productos cuentan con la garantía legal. Cualquier
          reclamo puede presentarse en el local o a través del correo{' '}
          <a
            href={`mailto:${BUSINESS.correoContacto}`}
            className="text-[color:var(--color-primary)] hover:underline"
          >
            {BUSINESS.correoContacto}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="6. Obligaciones y conducta del usuario">
        <p>El usuario se compromete a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Usar la plataforma de buena fe y conforme a la ley.</li>
          <li>No suministrar información falsa ni suplantar a otra persona.</li>
          <li>
            No intentar vulnerar la seguridad del sitio, acceder a cuentas ajenas ni
            interferir con su funcionamiento.
          </li>
          <li>
            Entregar información veraz sobre el estado de salud y comportamiento de su
            mascota, en beneficio de su bienestar y del personal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. Propiedad intelectual">
        <p>
          Los textos, logotipos, imágenes, la marca «{BUSINESS.nombreComercial}» y el software
          de la plataforma son propiedad del negocio o de sus titulares y están protegidos por
          la normativa colombiana sobre derechos de autor y propiedad industrial. No se permite
          su reproducción o uso sin autorización previa y escrita.
        </p>
      </LegalSection>

      <LegalSection heading="8. Responsabilidad">
        <p>
          {BUSINESS.nombreComercial} pondrá su mayor esfuerzo para mantener la plataforma
          disponible y con información correcta, pero no garantiza que el servicio esté libre
          de interrupciones o errores. No será responsable por fallas derivadas de la conexión
          del usuario, de terceros o de eventos de fuerza mayor.
        </p>
        <p>
          La responsabilidad por la prestación de los servicios de grooming y por los productos
          vendidos se rige por la ley colombiana y por estos términos.
        </p>
      </LegalSection>

      <LegalSection heading="9. Modificaciones">
        <p>
          {BUSINESS.nombreComercial} podrá actualizar estos Términos y Condiciones para
          reflejar cambios legales u operativos. La versión vigente siempre estará publicada en
          esta página con su fecha de actualización. El uso continuado de la plataforma después
          de un cambio implica su aceptación.
        </p>
      </LegalSection>

      <LegalSection heading="10. Ley aplicable y solución de controversias">
        <p>
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier
          controversia se tramitará ante los jueces competentes del domicilio del negocio, sin
          perjuicio del derecho del consumidor a acudir a la Superintendencia de Industria y
          Comercio (SIC) o a los mecanismos de protección al consumidor previstos en la ley.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contacto">
        <p>
          {BUSINESS.nombreComercial} — {BUSINESS.direccion}
          <br />
          Teléfono / WhatsApp: {BUSINESS.telefono}
          <br />
          Correo:{' '}
          <a
            href={`mailto:${BUSINESS.correoContacto}`}
            className="text-[color:var(--color-primary)] hover:underline"
          >
            {BUSINESS.correoContacto}
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
