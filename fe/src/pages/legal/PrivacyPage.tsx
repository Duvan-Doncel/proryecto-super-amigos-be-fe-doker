/**
 * Archivo: pages/legal/PrivacyPage.tsx
 * Descripción: Política de Privacidad y Tratamiento de Datos Personales (ruta /privacidad).
 * ¿Para qué? Informar al titular qué datos se recogen, con qué finalidad, quién los
 *   trata y cómo ejercer sus derechos, conforme a la ley colombiana de habeas data.
 * ¿Impacto? Es solo contenido de frontend. Marco legal de referencia: Ley 1581 de 2012,
 *   Decreto 1377 de 2013, Decreto 1074 de 2015 y directrices de la Superintendencia de
 *   Industria y Comercio (SIC).
 */

import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection } from './LegalLayout';
import { BUSINESS } from '@/config/legal';

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidad y Tratamiento de Datos Personales"
      intro={
        <>
          En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas
          concordantes, <strong>{BUSINESS.nombreComercial}</strong> ({BUSINESS.razonSocial}),
          con domicilio en {BUSINESS.direccion}, informa a los titulares la forma en que
          recolecta, usa, almacena y protege sus datos personales, así como los derechos que
          les asisten y los canales para ejercerlos.
        </>
      }
    >
      <LegalSection heading="1. Responsable del tratamiento">
        <p>
          {BUSINESS.nombreComercial} — {BUSINESS.nit}
          <br />
          Dirección: {BUSINESS.direccion}
          <br />
          Teléfono: {BUSINESS.telefono}
          <br />
          Correo para asuntos de datos personales:{' '}
          <a
            href={`mailto:${BUSINESS.correoDatos}`}
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            {BUSINESS.correoDatos}
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="2. Datos que recolectamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>De identificación y contacto:</strong> número de documento, nombres y
            apellidos, teléfono y correo electrónico.
          </li>
          <li>
            <strong>De la mascota:</strong> nombre, especie, raza, tamaño, peso, color, tipo
            de pelo, condiciones de piel, comportamiento y notas de atención.
          </li>
          <li>
            <strong>De actividad en la plataforma:</strong> citas solicitadas, reportes de
            síntomas, pedidos de productos e historial de servicios.
          </li>
          <li>
            <strong>Técnicos:</strong> datos necesarios para el funcionamiento de la sesión
            (por ejemplo, el token de autenticación almacenado en su navegador).
          </li>
        </ul>
        <p>
          No solicitamos datos sensibles de las personas. Si por la naturaleza de una consulta
          se llegara a requerir algún dato de salud del titular, su entrega es facultativa y
          requerirá autorización expresa.
        </p>
      </LegalSection>

      <LegalSection heading="3. Finalidades del tratamiento">
        <p>Los datos se tratan para:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear y administrar la cuenta del usuario y autenticar su acceso.</li>
          <li>Gestionar y confirmar citas de grooming y coordinar la atención.</li>
          <li>Registrar el historial de la mascota para prestar un mejor servicio.</li>
          <li>Gestionar pedidos de productos y su entrega en el local.</li>
          <li>Atender reportes de síntomas leves y brindar orientación general.</li>
          <li>Responder peticiones, quejas y reclamos, y cumplir obligaciones legales.</li>
          <li>
            Enviar comunicaciones operativas (confirmaciones, recordatorios, verificación de
            correo). El envío de información comercial o promocional requerirá autorización
            adicional y podrá revocarse en cualquier momento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Autorización del titular">
        <p>
          Al registrarse y marcar la casilla de aceptación, el titular autoriza de manera
          previa, expresa e informada el tratamiento de sus datos conforme a esta política. La
          autorización también puede obtenerse de forma verbal o por conducta inequívoca
          cuando el titular solicita un servicio de forma presencial.
        </p>
      </LegalSection>

      <LegalSection heading="5. Derechos del titular">
        <p>Conforme al artículo 8 de la Ley 1581 de 2012, el titular puede:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio por infracción a
            la ley.
          </li>
          <li>
            Revocar la autorización y/o solicitar la supresión de los datos cuando no exista
            un deber legal o contractual que obligue a conservarlos.
          </li>
          <li>Acceder de forma gratuita a sus datos personales.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Cómo ejercer sus derechos">
        <p>
          El titular o su representante puede presentar consultas y reclamos escribiendo al
          correo{' '}
          <a
            href={`mailto:${BUSINESS.correoDatos}`}
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            {BUSINESS.correoDatos}
          </a>{' '}
          o acercándose a {BUSINESS.direccion}. La solicitud debe indicar el nombre del
          titular, el motivo, la descripción de los hechos y una dirección de contacto.
        </p>
        <p>
          Las consultas se atienden en un plazo máximo de diez (10) días hábiles y los reclamos
          en un plazo máximo de quince (15) días hábiles, prorrogables según la ley cuando no
          sea posible resolverlos dentro de ese término.
        </p>
      </LegalSection>

      <LegalSection heading="7. Conservación y seguridad">
        <p>
          Los datos se conservan mientras exista la cuenta del usuario y durante los plazos
          adicionales que exijan las obligaciones legales, contables y de garantía. Vencidos
          esos plazos, los datos se suprimen o anonimizan.
        </p>
        <p>
          {BUSINESS.nombreComercial} adopta medidas administrativas, técnicas y físicas
          razonables para proteger los datos frente a acceso no autorizado, pérdida o uso
          indebido, como el control de acceso por usuario y contraseña y el almacenamiento en
          servicios con controles de seguridad.
        </p>
      </LegalSection>

      <LegalSection heading="8. Encargados y terceros">
        <p>
          Para operar la plataforma se utilizan proveedores tecnológicos (alojamiento, base de
          datos y envío de correos) que actúan como encargados del tratamiento y solo pueden
          usar los datos siguiendo las instrucciones de {BUSINESS.nombreComercial}. No se
          venden ni ceden datos personales a terceros con fines comerciales.
        </p>
      </LegalSection>

      <LegalSection heading="9. Datos de niños, niñas y adolescentes">
        <p>
          La plataforma no está dirigida a menores de edad. El tratamiento de datos de un menor
          solo procede cuando lo autoriza su representante legal y responde al interés superior
          del menor.
        </p>
      </LegalSection>

      <LegalSection heading="10. Vigencia y cambios">
        <p>
          Esta política rige desde su publicación. Cualquier cambio sustancial se informará a
          través de la plataforma. La versión vigente, con su fecha, siempre estará disponible
          en esta página y se relaciona con los{' '}
          <Link to="/terminos" className="text-brand-600 dark:text-brand-400 hover:underline">
            Términos y Condiciones
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
